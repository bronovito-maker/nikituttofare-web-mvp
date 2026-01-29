import { Resend } from 'resend';
import { createAdminClient } from './supabase-server';

// ============================================
// EMAIL CLIENT
// ============================================
const emailClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
};

// ============================================
// TELEGRAM HELPERS
// ============================================

interface TelegramMessage {
  text: string;
  parse_mode?: 'HTML' | 'Markdown';
  reply_markup?: {
    inline_keyboard: Array<Array<{
      text: string;
      url?: string;
      callback_data?: string;
    }>>;
  };
}

function getTelegramMessageId(payload: unknown): number | undefined {
  if (typeof payload !== 'object' || payload === null) return undefined;
  const result = (payload as { result?: unknown }).result;
  if (typeof result !== 'object' || result === null) return undefined;
  const messageId = (result as { message_id?: unknown }).message_id;
  return typeof messageId === 'number' ? messageId : undefined;
}

/**
 * Send a message to Telegram with proper timeout handling
 * FIX: Added AbortController with 15s timeout to prevent ETIMEDOUT errors
 */
async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  message: TelegramMessage
): Promise<{ ok: boolean; result?: unknown; error?: string }> {
  // Timeout di 15 secondi per evitare ETIMEDOUT
  const TELEGRAM_TIMEOUT_MS = 15000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TELEGRAM_TIMEOUT_MS);

  try {
    console.log('📤 Sending Telegram message to chat:', chatId);

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message.text,
        parse_mode: message.parse_mode || 'HTML',
        disable_web_page_preview: true,
        reply_markup: message.reply_markup,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      const errorMsg = `Telegram API error: ${response.status} - ${JSON.stringify(errorData)}`;
      console.error('❌ Telegram API error:', errorMsg);
      return { ok: false, error: errorMsg };
    }

    const result = await response.json();
    console.log('✅ Telegram message sent successfully');
    return { ok: true, result };
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    // Gestione specifica per diversi tipi di errore
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('⏱️ Telegram request timeout after', TELEGRAM_TIMEOUT_MS, 'ms');
        return { ok: false, error: `Timeout after ${TELEGRAM_TIMEOUT_MS}ms` };
      }

      // ETIMEDOUT o altri errori di rete
      const cause = (error as Error & { cause?: { code?: string } }).cause;
      if (cause?.code === 'ETIMEDOUT') {
        console.error('🌐 Network timeout (ETIMEDOUT) - possibly IPv6/DNS issue');
        return { ok: false, error: 'Network timeout - ETIMEDOUT' };
      }

      console.error('❌ Telegram fetch error:', error.message);
      return { ok: false, error: error.message };
    }

    console.error('❌ Telegram unknown error:', error);
    return { ok: false, error: 'Unknown error' };
  }
}

// ============================================
// CATEGORY & PRIORITY LABELS
// ============================================
const categoryNames: Record<string, string> = {
  plumbing: '🔧 Idraulico',
  electric: '⚡ Elettricista',
  locksmith: '🔑 Fabbro',
  climate: '❄️ Climatizzazione',
  generic: '🔩 Generico'
};

const priorityEmoji: Record<string, string> = {
  emergency: '🚨 EMERGENZA',
  high: '🔴 Alta',
  medium: '🟡 Media',
  low: '🟢 Bassa'
};

// ============================================
// PRIVACY-FIRST TELEGRAM NOTIFICATION
// For the technicians' group - NO personal data!
// ============================================

interface TicketNotificationData {
  id: string;
  category: string;
  priority: string;
  city?: string;
  price_range_min?: number;
  price_range_max?: number;
  description?: string;
  created_at?: string;
  // Sensitive data - NOT included in group notification
  phone?: string;
  address?: string;
  user_name?: string;
  photo_url?: string;
}

/**
 * Generate a one-time assignment token for a ticket
 */
async function generateAssignmentToken(ticketId: string): Promise<string | null> {
  try {
    const adminClient = createAdminClient();

    const { data, error } = await (adminClient as any).rpc('generate_assignment_token', {
      p_ticket_id: ticketId,
      p_expires_hours: 24
    });

    if (error) {
      console.error('Error generating assignment token:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in generateAssignmentToken:', error);
    return null;
  }
}

/**
 * Format the PRIVACY-FIRST message for the technicians' Telegram group
 * NO personal data: no name, no phone, no full address
 * 
 * TEMPLATE REFACTORED: Clean layout with clear sections
 */
function formatPrivacyFirstTelegramMessage(
  ticket: TicketNotificationData,
  acceptUrl: string
): TelegramMessage {
  const priority = priorityEmoji[ticket.priority] || ticket.priority.toUpperCase();
  const category = categoryNames[ticket.category] || ticket.category;

  // Format date nicely
  const requestDate = new Date(ticket.created_at || Date.now());
  const formattedDate = requestDate.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const formattedTime = requestDate.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  // Clean description: remove city/address duplications, phone numbers
  let cleanDescription = '';
  if (ticket.description) {
    cleanDescription = ticket.description
      .replaceAll(/\d{10,}/g, '') // Remove phone numbers
      .replaceAll(/(?:via|corso|piazza|viale)\s+[a-zàèéìòùáíóú\s]+[\s,]*\d*[a-z]?/gi, '') // Remove addresses
      .replaceAll(new RegExp(ticket.city || '', 'gi'), '') // Remove city mentions
      .replaceAll(/,\s*,/g, ',') // Clean up double commas
      .replaceAll(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .slice(0, 120);

    // Ensure we have something to show
    if (cleanDescription.length < 10 && ticket.description.length > 10) {
      cleanDescription = ticket.description.slice(0, 120);
    }
  }

  // Build clean message
  let text = `${priority}\n`;
  text += `━━━━━━━━━━━━━━━━━━\n\n`;

  text += `<b>Nuovo Intervento Disponibile</b>\n\n`;

  text += `📍 <b>Città:</b> ${ticket.city || 'Non specificata'}\n`;
  text += `🔧 <b>Tipo:</b> ${category}\n`;

  if (ticket.price_range_min && ticket.price_range_max) {
    text += `💰 <b>Preventivo:</b> ${ticket.price_range_min}€ - ${ticket.price_range_max}€\n`;
  }

  text += `\n`;

  // Clean problem description
  if (cleanDescription) {
    text += `📝 <b>Problema:</b> ${cleanDescription}${ticket.description && ticket.description.length > 120 ? '...' : ''}\n\n`;
  }

  text += `⏰ <b>Richiesta:</b> ${formattedDate}, ${formattedTime}\n\n`;

  text += `━━━━━━━━━━━━━━━━━━\n`;
  text += `<i>Clicca il pulsante per accettare l'intervento.\nIl primo tecnico che accetta riceverà i dati completi.</i>`;

  return {
    text,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [[
        {
          text: '✅ ACCETTA INTERVENTO',
          url: acceptUrl
        }
      ]]
    }
  };
}

/**
 * Main function to notify technicians about a new ticket
 * Privacy-first: group message has NO personal data
 */
export async function notifyNewTicket(ticket: TicketNotificationData) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://nikituttofare.com';

    if (!botToken || !chatId) {
      console.warn('Telegram non configurato - BOT_TOKEN o CHAT_ID mancanti');
      return { success: false, reason: 'telegram_not_configured' };
    }

    // Generate one-time assignment token
    const token = await generateAssignmentToken(ticket.id);
    if (!token) {
      console.error('Failed to generate assignment token for ticket:', ticket.id);
      return { success: false, reason: 'token_generation_failed' };
    }

    // Build the accept URL - use the new frictionless claim page
    const acceptUrl = `${baseUrl}/technician/claim?token=${token}`;

    // Format privacy-first message
    const message = formatPrivacyFirstTelegramMessage(ticket, acceptUrl);

    // Send to Telegram group
    const result = await sendTelegramMessage(botToken, chatId, message);

    if (result.ok) {
      // Log the notification (optional: save to DB)
      console.log('✅ Telegram notification sent for ticket:', ticket.id);

      const messageId = getTelegramMessageId(result.result);

      // Save notification record
      try {
        const adminClient = createAdminClient();
        await (adminClient as any)
          .from('technician_notifications')
          .insert({
            ticket_id: ticket.id,
            notification_type: 'telegram',
            telegram_message_id: messageId ? messageId.toString() : null,
            status: 'sent'
          });
      } catch (dbError) {
        console.warn('Could not save notification record:', dbError);
      }

      return { success: true, messageId };
    }

    return { success: false, reason: 'telegram_send_failed' };

  } catch (error) {
    console.warn('Errore notifica Telegram ticket:', error);
    return { success: false, reason: 'unknown_error', error };
  }
}

// ============================================
// EMAIL NOTIFICATIONS
// ============================================

const formatEmailHtml = (lead: Record<string, any>) => {
  const rows = [
    ['Nome', lead.nome || '—'],
    ['Telefono', lead.telefono || '—'],
    ['Persone', lead.persone ? String(lead.persone) : '—'],
    ['Orario', lead.orario || '—'],
    ['Stato', lead.stato || '—'],
    ['Intento', lead.intent || '—'],
  ];

  const details = rows
    .map(([label, value]) => `<tr><td style="padding:4px 8px;font-weight:600;">${label}</td><td style="padding:4px 8px;">${value}</td></tr>`)
    .join('');

  const note = lead.note_interne
    ? `<p style="margin:16px 0 0;font-size:14px;color:#405064;"><strong>Note interne:</strong> ${lead.note_interne}</p>`
    : '';

  const richiesta = lead.richiesta
    ? `<blockquote style="margin:16px 0;padding:12px 16px;background:#f3f5ff;border-left:3px solid #4f46e5;color:#1e293b;">${lead.richiesta.replaceAll('\n', '<br/>')}</blockquote>`
    : '';

  return `
    <div style="font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;color:#0f172a;">
      <p>Hai ricevuto un nuovo lead dal receptionist AI.</p>
      <table style="border-collapse:collapse;margin-top:12px;">${details}</table>
      ${note}
      ${richiesta}
      <p style="margin-top:24px;font-size:13px;color:#64748b;">Questa email è stata generata automaticamente dalla tua piattaforma AI Receptionist.</p>
    </div>
  `;
};

const formatSlackPayload = (lead: Record<string, any>) => ({
  text: String.raw`Nuovo lead per ${lead.tenant_id || 'tenant'}\n` +
    String.raw`Nome: ${lead.nome || '—'}\n` +
    String.raw`Telefono: ${lead.telefono || '—'}\n` +
    String.raw`Persone: ${lead.persone || '—'}\n` +
    String.raw`Orario: ${lead.orario || '—'}\n` +
    `Note: ${lead.note_interne || '—'}`,
});

export async function notifyLeadChannels(tenantId: string, lead: Record<string, any>) {
  try {
    // TODO: Replace this with Supabase logic to fetch notification settings
    const assistant = {
      notification_email: 'test@example.com',
      notification_slack_webhook: null,
      nome_attivita: 'Niki Restaurant (Mock)'
    };

    if (!assistant) return;

    const email = assistant.notification_email || undefined;
    const slackWebhook = assistant.notification_slack_webhook ?? undefined;

    if (email) {
      const resend = emailClient();
      if (resend) {
        try {
          await resend.emails.send({
            from: process.env.NOTIFICATIONS_EMAIL_FROM || 'AI Receptionist <no-reply@nikituttofare.com>',
            to: email,
            subject: `Nuovo lead • ${assistant.nome_attivita || tenantId}`,
            html: formatEmailHtml(lead),
          });
        } catch (error) {
          console.warn('Impossibile inviare email di notifica:', error);
        }
      }
    }

    if (slackWebhook) {
      try {
        await fetch(slackWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formatSlackPayload(lead)),
        });
      } catch (error) {
        console.warn('Impossibile inviare notifica Slack:', error);
      }
    }
  } catch (error) {
    console.warn('Errore durante la notifica lead:', error);
  }
}

// ============================================
// CLIENT NOTIFICATION (Email confirmation)
// ============================================

export async function sendClientConfirmationEmail(
  email: string,
  ticketId: string,
  details: {
    category: string;
    city: string;
    priceRange: string;
    phone: string;
  }
) {
  const resend = emailClient();
  if (!resend) {
    console.warn('Resend not configured - skipping client email');
    return;
  }

  try {
    await resend.emails.send({
      from: process.env.NOTIFICATIONS_EMAIL_FROM || 'NikiTuttoFare <no-reply@nikituttofare.com>',
      to: email,
      subject: `Richiesta confermata - Ticket #${ticketId.slice(-8).toUpperCase()}`,
      html: `
        <div style="font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#2563eb,#0891b2);padding:24px;border-radius:16px 16px 0 0;">
            <h1 style="color:white;margin:0;font-size:24px;">✅ Richiesta Confermata!</h1>
          </div>
          <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;">
            <p style="color:#475569;font-size:16px;margin-top:0;">
              Grazie per aver scelto NikiTuttoFare. La tua richiesta è stata registrata con successo.
            </p>
            
            <div style="background:white;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #e2e8f0;">
              <p style="margin:0 0 12px;"><strong>🎫 Ticket:</strong> #${ticketId.slice(-8).toUpperCase()}</p>
              <p style="margin:0 0 12px;"><strong>🔧 Servizio:</strong> ${categoryNames[details.category] || details.category}</p>
              <p style="margin:0 0 12px;"><strong>📍 Città:</strong> ${details.city}</p>
              <p style="margin:0 0 12px;"><strong>💰 Preventivo:</strong> ${details.priceRange}</p>
              <p style="margin:0;"><strong>📞 Telefono:</strong> ${details.phone}</p>
            </div>
            
            <div style="background:#fef3c7;border-radius:8px;padding:16px;border-left:4px solid #f59e0b;">
              <p style="margin:0;color:#92400e;font-size:14px;">
                <strong>⏱️ Prossimo passo:</strong><br>
                Un tecnico ti chiamerà entro 30-60 minuti per confermare l'appuntamento.
              </p>
            </div>
            
            <p style="color:#64748b;font-size:13px;margin-top:24px;text-align:center;">
              NikiTuttoFare - Pronto Intervento H24<br>
              <a href="https://nikituttofare.com" style="color:#2563eb;">www.nikituttofare.com</a>
            </p>
          </div>
        </div>
      `,
    });

    console.log('✅ Client confirmation email sent to:', email);
  } catch (error) {
    console.warn('Error sending client confirmation email:', error);
  }
}
