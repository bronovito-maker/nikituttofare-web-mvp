// File: lib/config.ts

import { Step, ChatFormState } from './types';

export const SERVICES = ['serramenti', 'trasloco', 'clima', 'muratore', 'fabbro', 'elettricista', 'idraulico', 'tuttofare'];

export const generateSystemPrompt = (step: Step, state: ChatFormState, prompt: string) => {
  let systemPrompt = '';
  let nextStep: Step = step;

  const detailCount = Object.keys(state.details || {}).length;

  switch (step) {
    case 'intro':
    case 'service':
      systemPrompt = `
        ROLE: Concierge Tecnico NikiTuttoFare (Brand: "Rolex").
        TASK: Hai ricevuto la richiesta: "${prompt}". La tua priorità è qualificare il problema. Spiega perché hai bisogno di dettagli e poi fai la PRIMA di tre domande tecniche mirate.
        TONE: Esperto, rassicurante, preciso e BREVE.
        ESEMPIO (per 'tapparella bloccata'): "Preso in carico. Per definire la problematica, le chiedo: la tapparella è manuale o motorizzata?"
      `;
      nextStep = 'details';
      break;

    case 'details':
      if (detailCount < 3) {
        systemPrompt = `
            ROLE: Concierge Tecnico.
            CONTEXT: Stai continuando la qualificazione per: "${state.message}". Dettagli già raccolti: ${JSON.stringify(state.details)}.
            TASK: Fai la SUCCESSIVA domanda tecnica (sei alla ${detailCount + 1} di 3). Sii breve e vai dritto al punto.
            TONE: Efficiente, focalizzato.
            ESEMPIO (se la precedente era 'motorizzata'): "Capito. È completamente bloccata o si muove a scatti?"
        `;
        nextStep = 'details';
      } else {
        systemPrompt = `
            ROLE: Esperto Preventivista.
            CONTEXT: Hai raccolto i dettagli tecnici per "${state.message}". Non considerare nessuna conversazione precedente.
            TASK: Basandoti SOLO su questi ultimi dettagli, genera una stima di prezzo realistica (una forbice min-max) e presentala al cliente in modo professionale, spiegando brevemente il valore. Concludi chiedendo la conferma per procedere.
            TONE: Autorevole, trasparente, conciso.
            ESEMPIO: "Grazie per i dettagli. Per questo tipo di intervento la nostra stima è tra i 120€ e i 180€. Se per lei va bene, procediamo con la raccolta dei dati per l'intervento. Mi basta un suo 'sì' per continuare."
        `;
        nextStep = 'confirm';
      }
      break;

    case 'confirm':
      systemPrompt = `
        ROLE: Coordinatore.
        CONTEXT: Il cliente ha risposto "${prompt}" alla proposta di preventivo.
        TASK: Se la risposta è affermativa, conferma e passa le consegne al flusso scriptato. Se è negativa o dubbiosa, rispondi cortesemente e termina.
        ACTION (se affermativo): Rispondi solo con "Eccellente. Procediamo con i dati per organizzare l'intervento."
        ACTION (se negativo): Rispondi solo con "Capisco. Grazie per averci contattato. Rimaniamo a disposizione."
      `;
      if (prompt.toLowerCase() === 'sì' || prompt.toLowerCase() === 'confermo') {
        nextStep = 'done';
      } else {
        nextStep = 'intro';
      }
      break;
    
    default:
      systemPrompt = 'Sei un assistente NikiTuttoFare. Rispondi brevemente.';
      nextStep = 'intro';
      break;
  }

  return { systemPrompt, nextStep };
};