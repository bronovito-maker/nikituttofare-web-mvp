import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import type { AIResponseType } from "@/lib/ai-structures";

// Inizializza Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, message } = body;

    // Estrai l'ultimo messaggio utente e il contesto
    let lastUserMessage = message;
    let conversationHistory: any[] = [];
    
    if (messages && Array.isArray(messages) && messages.length > 0) {
      conversationHistory = messages;
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user') {
        lastUserMessage = typeof lastMessage.content === 'string' 
          ? lastMessage.content 
          : JSON.stringify(lastMessage.content);
      } else {
        // Se l'ultimo messaggio non è dell'utente, cerca l'ultimo messaggio utente
        for (let i = messages.length - 1; i >= 0; i--) {
          if (messages[i].role === 'user') {
            lastUserMessage = typeof messages[i].content === 'string'
              ? messages[i].content
              : JSON.stringify(messages[i].content);
            break;
          }
        }
      }
    }

    if (!lastUserMessage || lastUserMessage.trim().length === 0) {
      return NextResponse.json({ 
        type: "text", 
        content: "Non ho capito. Puoi descrivere meglio il problema?" 
      } as AIResponseType);
    }

    // Usa il modello Flash (veloce ed economico)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Costruisci il contesto della conversazione
    const conversationContext = conversationHistory.length > 0
      ? conversationHistory
          .filter((m: any) => m.role === 'user' || m.role === 'assistant')
          .slice(-8) // Ultimi 8 messaggi per contesto completo
          .map((m: any) => {
            const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
            return `${m.role === 'user' ? 'Cliente' : 'Assistente'}: ${content}`;
          })
          .join('\n')
      : '';

    // Analizza se è una risposta a domande precedenti o un nuovo problema
    const isFollowUp = conversationContext.length > 0;
    const hasDetails = lastUserMessage.length > 20; // Messaggio dettagliato
    
    // Costruiamo il prompt per la Generative UI in modo sicuro
    const promptParts = [
      'Sei NikiTuttoFare, un assistente esperto e rassicurante per emergenze di manutenzione domestica.',
      'Il tuo obiettivo è aiutare il cliente a descrivere il problema in modo chiaro e rassicurarlo.',
      '',
      'REGOLE FONDAMENTALI:',
      '1. Sii sempre rassicurante, professionale e comprensivo',
      '2. MAI ripetere lo stesso messaggio generico - ogni risposta deve essere unica e personalizzata',
      '3. Riconosci i dettagli specifici che il cliente ha già fornito',
      '4. Se il cliente risponde a una tua domanda precedente, conferma la risposta',
      '5. Se il cliente ha già dato tutti i dettagli necessari, conferma e rassicura che un tecnico lo contatterà',
      '6. Per emergenze urgenti (chiuso fuori, perdita grave), mostra comprensione immediata',
      '7. Usa un tono calmo ma efficiente',
      '',
      'Categorie disponibili:',
      '- plumbing (idraulico: perdite d\'acqua, tubi rotti, scarichi intasati)',
      '- electric (elettricista: interruttori, prese, problemi elettrici)',
      '- locksmith (fabbro: serrature, chiavi perse, porte bloccate)',
      '- climate (clima: condizionatori, caldaie, riscaldamento)',
      '',
    ];
    
    if (conversationContext) {
      promptParts.push('Storia della conversazione:');
      promptParts.push(conversationContext);
      promptParts.push('');
    }
    
    promptParts.push(`Ultimo messaggio del cliente: ${lastUserMessage}`);
    promptParts.push('');
    promptParts.push(isFollowUp ? 'Questo è un messaggio di follow-up nella conversazione.' : 'Questo è l\'inizio della conversazione.');
    promptParts.push(hasDetails ? 'Il cliente ha fornito dettagli specifici.' : 'Il messaggio è breve, potrebbe servire più contesto.');
    promptParts.push('');
    promptParts.push('ESEMPI di risposte buone:');
    promptParts.push('- Se cliente dice che ha dimenticato la chiave: riconosci l\'urgenza e chiedi dove si trova la porta');
    promptParts.push('- Se cliente ha già dato tutti i dettagli: conferma le informazioni e rassicura che un tecnico contatterà presto');
    promptParts.push('- Se è un\'emergenza: mostra comprensione immediata e organizza l\'intervento');
    promptParts.push('');
    promptParts.push('Rispondi ESCLUSIVAMENTE con questo formato JSON (senza markdown):');
    promptParts.push('{');
    promptParts.push('  "type": "text",');
    promptParts.push('  "content": "Messaggio unico, personalizzato e rassicurante basato sul problema specifico del cliente"');
    promptParts.push('}');
    
    const prompt = promptParts.join('\n');

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Pulizia del JSON (Gemini a volte aggiunge ```json ... ```)
    let cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    // Prova a parsare il JSON
    let parsed: AIResponseType;
    try {
      parsed = JSON.parse(cleanJson);
    } catch (parseError) {
      // Se non è JSON valido, restituisci un messaggio di testo
      parsed = {
        type: "text",
        content: text || "Ho capito il tuo problema. Un tecnico ti contatterà a breve per risolverlo."
      };
    }
    
    return NextResponse.json(parsed);

  } catch (error) {
    console.error("Gemini Error:", error);
    // Fallback sicuro se l'AI fallisce
    return NextResponse.json({ 
      type: "text", 
      content: "Ho ricevuto la tua richiesta. Un tecnico ti contatterà presto per risolvere il problema." 
    } as AIResponseType);
  }
}
