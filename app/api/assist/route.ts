import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { z } from 'zod'
import { AIResponseSchema, type AIResponseType } from '@/lib/ai-structures'
import {
  createTicket,
  saveMessage,
  getCurrentUser,
  updateTicketStatus,
} from '@/lib/supabase-helpers'
import { notifyNewTicket } from '@/lib/notifications'
import {
  checkRateLimit,
  getClientIdentifier,
  RATE_LIMITS,
  rateLimitExceededResponse,
} from '@/lib/rate-limit'
import {
  type ConversationSlots,
  extractSlotsFromConversation,
  getMissingSlots,
  canCreateTicket,
  buildNikiSystemPrompt,
  getQuestionForSlot,
  SLOT_NAMES_IT,
  CATEGORY_NAMES_IT,
  calculatePriceRange,
  canGivePriceEstimate,
  generatePriceEstimateMessage,
  checkProblemDetailsValid,
} from '@/lib/system-prompt'

// Zod Schemas for input validation
const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.unknown(),
  photo: z.string().optional(),
})

const problemCategoryEnum = z.enum(['plumbing', 'electric', 'locksmith', 'climate', 'handyman', 'generic']);

const LockedSlotsSchema = z
  .object({
    problemCategory: problemCategoryEnum,
    city: z.string(),
    userConfirmed: z.boolean(),
    quoteRejected: z.boolean(),
  })
  .partial()

const AssistApiSchema = z.object({
  messages: z.array(MessageSchema),
  ticketId: z.string().uuid().optional().nullable(),
  lockedSlots: LockedSlotsSchema.optional(),
})

type ChatMessage = z.infer<typeof MessageSchema>

// ============================================
// NORMALIZZAZIONE TESTO (typos, dialetti, etc.)
// ============================================
import {
  extractPhoneNumber,
  extractAddress,
  extractCategory,
  extractUrgency,
  normalizeText
} from '@/lib/assist-extraction';

// ============================================
// ESTRAZIONE DATI DAL MESSAGGIO (fallback)
// ============================================
function extractDataFromMessage(message: string): Partial<ConversationSlots> {
  const text = normalizeText(message)
  const extracted: Partial<ConversationSlots> = {}

  const phoneNumber = extractPhoneNumber(message);
  if (phoneNumber) extracted.phoneNumber = phoneNumber;

  const address = extractAddress(message);
  if (address) extracted.serviceAddress = address;

  const category = extractCategory(text);
  if (category) extracted.problemCategory = category;

  const urgency = extractUrgency(text);
  if (urgency) extracted.urgencyLevel = urgency;

  if (message.length > 15) {
    extracted.problemDetails = message.slice(0, 200)
  }

  return extracted
}

// ============================================
// ANALISI PRIORITÀ
// ============================================
function determinePriority(
  slots: ConversationSlots,
): 'low' | 'medium' | 'high' | 'emergency' {
  if (slots.urgencyLevel === 'emergency') return 'emergency'

  const details = (slots.problemDetails || '').toLowerCase()

  const emergencyKeywords = [
    'allagamento',
    'bloccato fuori',
    'senza corrente',
    'gas',
    'incendio',
    'pericolo',
  ]
  if (emergencyKeywords.some(kw => details.includes(kw))) {
    return 'emergency'
  }

  const highKeywords = ['perdita', 'urgente', 'oggi', 'subito']
  if (highKeywords.some(kw => details.includes(kw))) {
    return 'high'
  }

  return 'medium'
}

// ============================================
// GEMINI AI SETUP
// ============================================
const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY
let genAI: GoogleGenerativeAI | null = null

if (geminiApiKey && geminiApiKey !== 'placeholder_gemini_api_key') {
  genAI = new GoogleGenerativeAI(geminiApiKey)
}

function stringifyContent(content: unknown): string {
  if (typeof content === 'string') return content
  try {
    return JSON.stringify(content)
  } catch {
    return String(content ?? '')
  }
}

// ============================================
// FALLBACK RESPONSE HELPERS
// ============================================
function createGreetingResponse(
  slots: ConversationSlots,
  missingSlots: (keyof ConversationSlots)[],
): AIResponseType {
  let greeting =
    "Ciao! Sono Niki, il tuo assistente per emergenze domestiche 🔧\n\n"

  if (slots.problemCategory && slots.problemCategory !== 'generic') {
    greeting += `Ho capito che hai un problema di tipo **${CATEGORY_NAMES_IT[slots.problemCategory] || slots.problemCategory
      }**. `
  }

  if (slots.urgencyLevel === 'emergency') {
    greeting += "🚨 **Capisco che è un'emergenza!** Ti aiuto subito.\n\n"
  }

  if (missingSlots.length > 0) {
    greeting += getQuestionForSlot(missingSlots[0], slots.problemCategory)
  } else {
    greeting += 'Ho bisogno di alcune informazioni per inviarti un tecnico.'
  }

  return { type: 'text', content: greeting }
}

function createConfirmationResponse(
  slots: ConversationSlots,
  ticketId: string,
): AIResponseType {
  return {
    type: 'confirmation',
    content: {
      message: `La tua richiesta è stata confermata! Un tecnico ${CATEGORY_NAMES_IT[slots.problemCategory || 'generic'] || ''
        } ti contatterà al numero ${slots.phoneNumber} il prima possibile.`,
      ticketId: ticketId,
    },
  } as AIResponseType
}

function createRecapResponse(
  slots: ConversationSlots,
  ticketId: string | null,
): AIResponseType {
  const priority = determinePriority(slots)
  let timeEstimate = '24-48 ore'
  if (priority === 'emergency') {
    timeEstimate = '30-60 minuti'
  } else if (priority === 'high') {
    timeEstimate = '2-4 ore'
  }

  return {
    type: 'recap',
    content: {
      title: 'Riepilogo della tua richiesta',
      summary: 'Ho raccolto tutte le informazioni necessarie. Ecco il riepilogo:',
      details: {
        problema: slots.problemDetails || 'Non specificato',
        categoria:
          CATEGORY_NAMES_IT[slots.problemCategory || 'generic'] ||
          slots.problemCategory ||
          'Generico',
        indirizzo: slots.serviceAddress || 'Non specificato',
        telefono: slots.phoneNumber || 'Non specificato',
      },
      estimatedTime: timeEstimate,
      ticketId: ticketId || undefined,
      confirmationNeeded: true,
    },
  } as AIResponseType
}

function createNextQuestionResponse(
  slots: ConversationSlots,
  missingSlots: (keyof ConversationSlots)[],
): AIResponseType {
  const nextSlot = missingSlots[0]
  let response = ''

  const collectedCount = Object.values(slots).filter(v => v !== undefined).length
  if (collectedCount > 0 && collectedCount % 2 === 0) {
    const collectedData: string[] = []
    if (slots.phoneNumber) collectedData.push(`📞 ${slots.phoneNumber}`)
    if (slots.serviceAddress) collectedData.push(`📍 ${slots.serviceAddress}`)
    if (slots.problemCategory && slots.problemCategory !== 'generic') {
      collectedData.push(`🔧 ${CATEGORY_NAMES_IT[slots.problemCategory]}`)
    }

    if (collectedData.length > 0) {
      response += '✅ Registrato: ' + collectedData.join(' • ') + '\n\n'
    }
  }

  response += getQuestionForSlot(nextSlot, slots.problemCategory)

  return { type: 'text', content: response }
}

function generateFallbackResponse(
  slots: ConversationSlots,
  ticketId: string | null,
  isFirstMessage: boolean,
  userConfirmed: boolean = false,
): AIResponseType {
  const missingSlots = getMissingSlots(slots)

  if (isFirstMessage) {
    return createGreetingResponse(slots, missingSlots)
  }

  if (missingSlots.length === 0) {
    if (userConfirmed && ticketId) {
      return createConfirmationResponse(slots, ticketId)
    }
    if (!userConfirmed) {
      return createRecapResponse(slots, ticketId)
    }
  }

  return createNextQuestionResponse(slots, missingSlots)
}

// ============================================
// GENERAZIONE RISPOSTA AI (con Gemini)
// ============================================
async function callGemini(fullPrompt: string): Promise<string | null> {
  if (!genAI) return null
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(fullPrompt)
    const response = result.response
    return response.text()
  } catch (error) {
    console.error('Errore Gemini:', error)
    return null
  }
}

function parseAndValidateAIResponse(
  text: string,
  slots: ConversationSlots,
): AIResponseType | null {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')

  if (start === -1 || end === -1 || end <= start) return null

  const jsonString = text.substring(start, end + 1)

  try {
    const parsed = JSON.parse(jsonString)
    if (parsed.shouldCreateTicket && !canCreateTicket(slots)) {
      parsed.shouldCreateTicket = false
    }

    const validated = AIResponseSchema.safeParse(parsed)
    if (validated.success) {
      return validated.data
    }

    if (parsed.content) {
      return { type: parsed.type || 'text', content: parsed.content }
    }
  } catch (parseError) {
    console.error('JSON parse error:', parseError)
  }
  return null
}

function getCleanTextFromAIResponse(text: string): string {
  let cleaned = text.replaceAll('```json', '').replaceAll('```', '')

  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')

  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.substring(0, start) + cleaned.substring(end + 1)
  }

  return cleaned.trim()
}

async function generateAIResponse(
  messages: ChatMessage[],
  slots: ConversationSlots,
  ticketId: string | null,
  isFirstMessage: boolean,
  userConfirmed: boolean = false,
): Promise<AIResponseType> {
  const systemPrompt = buildNikiSystemPrompt(slots, ticketId)
  const conversationHistory = messages
    .map(m => `${m.role.toUpperCase()}: ${stringifyContent(m.content)}`)
    .join('\n')
  const fullPrompt = `${systemPrompt}\n\n# STORICO CONVERSAZIONE\n${conversationHistory}\n\n# ISTRUZIONI FINALI\nBasandoti sullo storico e sui dati raccolti, genera la prossima risposta seguendo il flusso di slot-filling. Ricorda: NON creare ticket finché non hai TUTTI i dati (telefono, indirizzo, categoria, dettagli). Rispondi SOLO con un JSON valido nel formato specificato.`

  const aiText = await callGemini(fullPrompt)

  if (aiText) {
    const parsedResponse = parseAndValidateAIResponse(aiText, slots)
    if (parsedResponse) return parsedResponse

    const cleanText = getCleanTextFromAIResponse(aiText)
    if (cleanText) {
      return { type: 'text', content: cleanText }
    }
  }

  return generateFallbackResponse(slots, ticketId, isFirstMessage, userConfirmed)
}

// ============================================
// POST HANDLER HELPERS
// ============================================

function mergeSlots(
  frontendLockedSlots: Partial<ConversationSlots>,
  extractedSlots: Partial<ConversationSlots>,
  newData: Partial<ConversationSlots>,
  userEmail: string | undefined,
): ConversationSlots {
  const slots: ConversationSlots = {}

  const allSlotKeys: (keyof ConversationSlots)[] = [
    'userEmail',
    'city',
    'streetAddress',
    'serviceAddress',
    'phoneNumber',
    'problemCategory',
    'problemDetails',
    'hasPhoto',
    'photoUrl',
    'priceRangeMin',
    'priceRangeMax',
    'priceEstimateGiven',
    'urgencyLevel',
    'userConfirmed',
    'quoteRejected',
  ]

  for (const key of allSlotKeys) {
    const lockedValue = frontendLockedSlots[key]
    const extractedValue = extractedSlots[key]
    const newValue = newData[key]

    let finalValue: any = [lockedValue, newValue, extractedValue].find(
      v => v !== undefined && v !== null && v !== '',
    )

    if (finalValue !== undefined) {
      ; (slots as Record<keyof ConversationSlots, any>)[key] = finalValue
    }
  }

  if (userEmail && !slots.userEmail) {
    slots.userEmail = userEmail
  }

  if (slots.city && slots.streetAddress && !slots.serviceAddress) {
    slots.serviceAddress = `${slots.streetAddress}, ${slots.city}`
  }

  return slots
}

async function handlePriceEstimation(
  slots: ConversationSlots,
  existingTicketId: string | null | undefined,
): Promise<NextResponse | null> {
  const detailsValid = checkProblemDetailsValid(slots)
  const canEstimate = canGivePriceEstimate(slots) && detailsValid

  if (canEstimate && !slots.userConfirmed) {
    if (slots.quoteRejected) {
      return NextResponse.json({
        type: 'text',
        content:
          'Capisco. Nessun problema.\n\nSe vuoi, posso:\n- stimare un preventivo più preciso se mi dai 1-2 dettagli in più\n- oppure aiutarti con un altro tipo di intervento.\n\nDimmi pure come preferisci.',
      })
    }

    const range = calculatePriceRange(slots)
    slots.priceEstimateGiven = true
    slots.priceRangeMin = range.min
    slots.priceRangeMax = range.max

    return NextResponse.json({
      type: 'price_estimate',
      content: {
        message: generatePriceEstimateMessage(slots),
        priceMin: range.min,
        priceMax: range.max,
        category: slots.problemCategory,
        needsConfirmation: true,
      },
    })
  }
  return null
}

async function handleUserConfirmation(
  slots: ConversationSlots,
): Promise<NextResponse | null> {
  if (slots.userConfirmed) {
    if (!slots.streetAddress) {
      return NextResponse.json({
        type: 'text',
        content: getQuestionForSlot('streetAddress', slots.problemCategory),
      })
    }
    if (!slots.phoneNumber) {
      return NextResponse.json({
        type: 'text',
        content: getQuestionForSlot('phoneNumber', slots.problemCategory),
      })
    }
  }
  return null
}

async function handleTicketCreation(
  slots: ConversationSlots,
  ticketId: string | null | undefined,
  user: any,
  lastUserMessage: ChatMessage,
): Promise<NextResponse | { ticketId: string | null; shouldCreateTicket: boolean }> {
  // const detailsValid = checkProblemDetailsValid(slots)
  const hasAllDataForTicketCreation = canCreateTicket(slots)
  const shouldCreateNewTicket = !ticketId && hasAllDataForTicketCreation && user?.id

  if (shouldCreateNewTicket) {
    const priority = determinePriority(slots)
    const problemDescription =
      slots.problemDetails ||
      "Problema descritto dall'utente - dettagli da confermare con il tecnico"

    const newTicket = await createTicket({
      userId: user.id,
      category: slots.problemCategory || 'generic',
      description: problemDescription,
      priority,
      address: slots.serviceAddress || undefined,
      status: 'pending_verification',
    })

    if (!newTicket) {
      return NextResponse.json({
        type: 'text',
        content:
          '⚠️ Si è verificato un errore durante la creazione della richiesta. Riprova tra qualche istante o contatta il supporto al +39 346 102 7447.',
      })
    }

    ticketId = newTicket.id
    await saveMessage(
      ticketId,
      'user',
      stringifyContent(lastUserMessage.content),
      lastUserMessage.photo,
    )

    if (user.email && !user.email.includes('guest')) {
      await updateTicketStatus(ticketId, 'confirmed')
      const priceRange = calculatePriceRange(slots)
      await notifyNewTicket({
        id: ticketId,
        category: slots.problemCategory || 'generic',
        priority: priority,
        city: slots.city,
        price_range_min: priceRange.min,
        price_range_max: priceRange.max,
        description: slots.problemDetails,
        address: slots.serviceAddress,
        phone: slots.phoneNumber,
      })
      return NextResponse.json({
        type: 'confirmation',
        content: {
          message: `🎉 La tua richiesta è stata confermata!\n\nUn tecnico **${CATEGORY_NAMES_IT[slots.problemCategory || 'generic']
            }** ti chiamerà al numero **${slots.phoneNumber
            }** entro 30-60 minuti per confermare l'appuntamento.\n\n📍 Intervento a: ${slots.serviceAddress
            }\n💰 Preventivo: ${priceRange.min}€ - ${priceRange.max}€`,
          ticketId: ticketId,
        },
      })
    }

    return NextResponse.json({
      type: 'auth_required',
      content: {
        content: `Perfetto! Ho raccolto tutte le informazioni necessarie per la tua richiesta di intervento **${CATEGORY_NAMES_IT[slots.problemCategory || 'generic']
          }**.\n\n📧 **Per completare la richiesta in sicurezza, accedi con la tua email.**\n\nRiceverai un link di conferma e solo dopo il click il tecnico verrà avvisato.`,
        ticketData: {
          category: slots.problemCategory,
          city: slots.city,
          address: slots.serviceAddress,
          description: slots.problemDetails,
          phone: slots.phoneNumber,
        },
      },
    })
  }
  return { ticketId: ticketId ?? null, shouldCreateTicket: !!shouldCreateNewTicket }
}

async function preliminaryChecks(request: NextRequest) {
  const clientId = getClientIdentifier(request)
  const rateLimitResult = checkRateLimit(
    `assist:${clientId}`,
    RATE_LIMITS.assist,
  )
  if (!rateLimitResult.success)
    return { error: rateLimitExceededResponse(rateLimitResult) }

  const body = await request.json()
  const validation = AssistApiSchema.safeParse(body)
  if (!validation.success) {
    return {
      error: NextResponse.json(
        { error: 'Messaggi non validi', details: validation.error.flatten() },
        { status: 400 },
      ),
    }
  }

  const { messages, ticketId: existingTicketId, lockedSlots } = validation.data
  const user = await getCurrentUser()
  const lastUserMessage = messages.findLast(m => m.role === 'user')
  if (!lastUserMessage) {
    return {
      error: NextResponse.json(
        { error: 'Nessun messaggio utente' },
        { status: 400 },
      ),
    }
  }

  return {
    data: { messages, existingTicketId, lockedSlots, user, lastUserMessage },
  }
}

function buildFinalResponse(
  aiResponse: AIResponseType,
  shouldCreateTicket: boolean,
  ticketId: string | null,
  slots: ConversationSlots,
) {
  const detailsValid = checkProblemDetailsValid(slots)
  const missingSlots = getMissingSlots(slots)

  return NextResponse.json({
    ...aiResponse,
    _debug: {
      ticketCreated: shouldCreateTicket,
      ticketId,
      slots: {
        category: slots.problemCategory || null,
        phone: slots.phoneNumber || null,
        address: slots.serviceAddress || null,
        city: slots.city || null,
        details: detailsValid ? slots.problemDetails || null : null,
        priceEstimateGiven: slots.priceEstimateGiven || false,
        priceRangeMin: slots.priceRangeMin ?? null,
        priceRangeMax: slots.priceRangeMax ?? null,
        userConfirmed: slots.userConfirmed || false,
        quoteRejected: slots.quoteRejected || false,
      },
      slotsCollected: {
        city: !!slots.city,
        phone: !!slots.phoneNumber,
        address: !!slots.serviceAddress,
        category: !!slots.problemCategory,
        details: detailsValid,
        priceEstimateGiven: !!slots.priceEstimateGiven,
        userConfirmed: !!slots.userConfirmed,
        quoteRejected: !!slots.quoteRejected,
      },
      missingSlots: missingSlots.map(s => SLOT_NAMES_IT[s] || s),
    },
  })
}

// ============================================
// MAIN API HANDLER
// ============================================
export async function POST(request: NextRequest) {
  try {
    const checks = await preliminaryChecks(request)
    if (checks.error) return checks.error

    // TypeScript type narrowing - checks.data is guaranteed to exist here
    if (!checks.data) {
      return NextResponse.json({ error: 'Invalid state' }, { status: 500 })
    }

    const {
      messages,
      existingTicketId,
      lockedSlots,
      user,
      lastUserMessage,
    } = checks.data

    const conversationMessages = messages.map(m => ({
      role: m.role,
      content: stringifyContent(m.content),
    }))
    const extractedSlots = extractSlotsFromConversation(
      conversationMessages,
      user?.email,
    )
    const newData = extractDataFromMessage(
      stringifyContent(lastUserMessage.content),
    )
    const slots = mergeSlots(lockedSlots || {}, extractedSlots, newData, user?.email)

    const priceResponse = await handlePriceEstimation(slots, existingTicketId)
    if (priceResponse) return priceResponse

    const confirmationResponse = await handleUserConfirmation(slots)
    if (confirmationResponse) return confirmationResponse

    const ticketResult = await handleTicketCreation(
      slots,
      existingTicketId,
      user,
      lastUserMessage,
    )
    if (ticketResult instanceof NextResponse) return ticketResult

    let { ticketId, shouldCreateTicket } = ticketResult
    const finalTicketId: string | null = ticketId ?? null;

    const isFirstMessage = messages.filter(m => m.role === 'user').length === 1
    const aiResponse = await generateAIResponse(
      messages,
      slots,
      finalTicketId,
      isFirstMessage,
      slots.userConfirmed || false,
    )

    if (finalTicketId && typeof aiResponse.content === 'string') {
      await saveMessage(finalTicketId, 'assistant', aiResponse.content)
    }

    return buildFinalResponse(aiResponse, shouldCreateTicket, finalTicketId, slots)
  } catch (error) {
    console.error("Errore nell'AI assist:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dati della richiesta non validi', details: error.flatten() },
        { status: 400 },
      )
    }
    return NextResponse.json(
      {
        type: 'text',
        content:
          "Mi scusi, ho avuto un problema tecnico. Può ripetere la sua richiesta? Se è un'emergenza, chiami direttamente il numero +39 346 102 7447.",
      },
      { status: 500 },
    )
  }
}