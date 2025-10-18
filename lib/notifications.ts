import { Resend } from 'resend';
import { listViewRowsById } from './noco-helpers';

const ASSISTANTS_TABLE_ID = process.env.NOCO_TABLE_ASSISTANTS_ID;
const ASSISTANTS_VIEW_ID = process.env.NOCO_VIEW_ASSISTANTS_ID;

const emailClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
};

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
    ? `<blockquote style="margin:16px 0;padding:12px 16px;background:#f3f5ff;border-left:3px solid #4f46e5;color:#1e293b;">${lead.richiesta.replace(/\n/g, '<br/>')}</blockquote>`
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
  text: `Nuovo lead per ${lead.tenant_id || 'tenant'}\\n` +
    `Nome: ${lead.nome || '—'}\\n` +
    `Telefono: ${lead.telefono || '—'}\\n` +
    `Persone: ${lead.persone || '—'}\\n` +
    `Orario: ${lead.orario || '—'}\\n` +
    `Note: ${lead.note_interne || '—'}`,
});

export async function notifyLeadChannels(tenantId: string, lead: Record<string, any>) {
  try {
    if (!ASSISTANTS_TABLE_ID || !ASSISTANTS_VIEW_ID) {
      console.warn('ID tabella/vista assistenti mancanti. Nessuna notifica inviata.');
      return;
    }

    const whereClause = `(tenant_id,eq,${tenantId})`;
    const assistants = await listViewRowsById(ASSISTANTS_TABLE_ID, ASSISTANTS_VIEW_ID, {
      where: whereClause,
      limit: 1,
    });

    const assistant = Array.isArray(assistants.list) ? assistants.list[0] : null;

    if (!assistant) return;

    const email = assistant.notification_email as string | undefined;
    const slackWebhook = assistant.notification_slack_webhook as string | undefined;

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
