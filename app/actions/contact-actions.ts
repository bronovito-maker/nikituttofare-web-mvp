'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { z } from 'zod';

const contactSchema = z.object({
    name: z.string().min(2),
    phone: z.string().min(10),
    category: z.string(),
    message: z.string().min(10),
});

export async function submitContactForm(data: z.infer<typeof contactSchema>) {
    try {
        const validatedData = contactSchema.parse(data);
        const supabase = createAdminClient();

        // 1. Save to Supabase (Leads table) - using admin client to bypass RLS for public form
        const { error: dbError } = await supabase
            .from('leads' as any)
            .insert({
                name: validatedData.name,
                phone: validatedData.phone,
                type: 'Contatto Sito',
                notes: `[Categoria: ${validatedData.category}]\n${validatedData.message}`,
                created_at: new Date().toISOString(),
            });

        if (dbError) {
            console.error('Error saving lead to database:', dbError);
            return { success: false, error: 'Errore durante il salvataggio dei dati.' };
        }

        // 2. Send Telegram Notification (Proactive logic)
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (botToken && chatId) {
            const message = `
<b>📩 Nuovo Messaggio dal Sito</b>
━━━━━━━━━━━━━━━━━━
👤 <b>Nome:</b> ${validatedData.name}
📞 <b>Tel:</b> ${validatedData.phone}
🔧 <b>Categoria:</b> ${validatedData.category.toUpperCase()}

📝 <b>Messaggio:</b>
<i>${validatedData.message}</i>
━━━━━━━━━━━━━━━━━━
`;

            try {
                await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: message,
                        parse_mode: 'HTML',
                    }),
                });
            } catch (tgError) {
                console.warn('Could not send Telegram notification for contact form:', tgError);
                // We don't fail the submission if notification fails
            }
        }

        return { success: true };
    } catch (error) {
        console.error('Contact form submission error:', error);
        return { success: false, error: 'Si è verificato un errore imprevisto.' };
    }
}
