import { NextRequest, NextResponse } from "next/server";

type AiResult = {
  category?: string;
  urgency?: 'bassa'|'media'|'alta'|'critica'|string;
  feasible?: boolean;
  summary?: string;
  price?: number;
  price_low?: number;
  price_high?: number;
  est_minutes?: number;
  source?: 'n8n'|'local';
};

function isGreeting(text: string): boolean {
  const t = (text || '').toLowerCase().trim();
  const starts = ['ciao','buongiorno','buonasera','salve','hey','hola'];
  return starts.some(w => t.startsWith(w)) || ['ciao','hey','hola'].includes(t);
}

function isTooGeneric(text: string): boolean {
  const t = (text || '').toLowerCase().trim();
  if (t.length < 8) return true;
  const generic = ['aiuto', 'help', 'info', 'informazioni', 'preventivo', 'problema'];
  return generic.includes(t);
}

function localClassify(text: string): AiResult {
  const s = (text || '').toLowerCase();
  const has = (...keys: string[]) => keys.some(k => s.includes(k));

  // Categoria (solo i gruppi Telegram + tuttofare)
  let category: string = 'tuttofare';
  if (has('lavandino','rubinetto','sifone','wc','scarico','perdita','acqua','caldaia','scaldabagno','boiler'))
    category = 'idraulico';
  if (has('presa','interruttore','corto','scintille','corrente','differenziale','quadro'))
    category = 'elettricista';
  if (has('porta','serratura','chiave','bloccata','sblocco'))
    category = 'fabbro';
  if (has('muro','intonaco','cartongesso','mattoni','muratore','tramezzo','forare','stuccare','rasare'))
    category = 'muratore';
  if (has('condizionatore','clima','split','aria condizionata'))
    category = 'clima';
  if (has('finestra','infisso','serramento','porta finestra','vetro','tapparella','zanzariera'))
    category = 'serramenti';
  if (has('trasloco','scatole','trasporto mobili','furgone','smontare','rimontare','svuota','sgombero'))
    category = 'trasloco';

  // Urgenza
  let urgency: AiResult['urgency'] = 'media';
  if (has('subito','urgente','adesso','stasera','oggi')) urgency = 'alta';
  if (has('perdita','allag','gas','corto','scintille','fuoco','fumo','porta bloccata','chiuso fuori'))
    urgency = 'critica';

  // Fattibilità
  let feasible = true;

  // Prezzi base indicativi per categoria (tarabili)
  const base: Record<string, {price:number, minutes:number}> = {
    'idraulico': { price: 90, minutes: 60 },
    'elettricista': { price: 90, minutes: 60 },
    'fabbro': { price: 120, minutes: 60 },
    'muratore': { price: 110, minutes: 120 },
    'clima': { price: 120, minutes: 90 },
    'serramenti': { price: 130, minutes: 90 },
    'trasloco': { price: 150, minutes: 180 },
    'tuttofare': { price: 70, minutes: 60 }
  };
  const ref = base[category] || base['tuttofare'];

  let price = ref.price;
  let est_minutes = ref.minutes;
  if (urgency === 'critica') { price += 30; est_minutes = Math.max(30, est_minutes - 10); }
  if (has('diagnosi','sopralluogo','preventivo')) { price -= 10; est_minutes += 10; }

  // Incertezza → range più ampio
  const uncertain = ['forse','non so','credo','vecchio','anni','datato','problema da tempo'].some(k => s.includes(k));
  const varPerc = urgency === 'critica' ? 0.25 : (uncertain ? 0.22 : 0.15);
  const price_low = Math.max(0, Math.round(price * (1 - varPerc)));
  const price_high = Math.round(price * (1 + varPerc));

  // Summary
  let summary = (text || '').trim();
  if (summary.length > 160) summary = summary.slice(0, 157) + '...';

  return { category, urgency, feasible, price, price_low, price_high, est_minutes, summary, source: 'local' };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = String(body.message || '');

    // 0) Saluti e messaggi troppo generici: niente preventivo, solo guida
    if (isGreeting(message)) {
      return NextResponse.json({
        ok: true,
        data: {
          category: 'none',
          summary: '👋 Ciao! Siamo qui per prenderti per mano e risolvere il tuo problema senza pensieri: idraulico, elettricista, fabbro, muratore, clima, serramenti, trasloco e piccoli lavori. Raccontami in una frase cosa succede (es. “perdita dal lavandino in bagno”) e preparo subito una stima chiara.'
        }
      });
    }
    if (isTooGeneric(message)) {
      return NextResponse.json({
        ok: true,
        data: {
          category: 'none',
          summary: 'Per poterti aiutare al meglio, scrivimi in una riga cosa succede e dove (es. “presa cucina fa scintille”, “manca acqua calda in bagno”, “devo montare una mensola in salotto”). Così preparo una stima precisa e trasparente.'
        }
      });
    }

    const url = process.env.N8N_CLASSIFY_URL || '';

    // 1) prova n8n se configurato
    if (url) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, context: body.context || {} })
        });
        const text = await res.text();
        let data: any; try { data = JSON.parse(text); } catch { data = { raw: text }; }
        if (res.ok) {
          const normalized: AiResult = {
            category: data.category ?? data.data?.category,
            urgency: data.urgency ?? data.data?.urgency,
            feasible: typeof data.feasible === 'boolean' ? data.feasible : (data.data?.feasible ?? true),
            summary: data.summary ?? data.data?.summary ?? message,
            price: data.price ?? data.data?.price,
            price_low: data.price_low ?? data.data?.price_low,
            price_high: data.price_high ?? data.data?.price_high,
            est_minutes: data.est_minutes ?? data.data?.est_minutes,
            source: 'n8n'
          };
          return NextResponse.json({ ok: true, data: normalized });
        }
      } catch (_) {
        // fallback su locale
      }
    }

    // 2) fallback locale
    const local = localClassify(message);
    return NextResponse.json({ ok: true, data: local });
  } catch {
    const local = localClassify('');
    return NextResponse.json({ ok: true, data: local });
  }
}