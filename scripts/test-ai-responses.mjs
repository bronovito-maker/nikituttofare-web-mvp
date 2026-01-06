#!/usr/bin/env node
/**
 * 🧪 NikiTuttoFare - AI Response Test Suite
 * 
 * Esegui con: node scripts/test-ai-responses.mjs
 * Con filtri: node scripts/test-ai-responses.mjs --urgency=emergency
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mappa urgency del JSON → priority dell'AI
const urgencyToPriorityMap = {
  emergency: ['emergency', 'high'],
  high: ['high', 'emergency'],
  medium: ['medium', 'high'],
  low: ['low', 'medium'],
};

// Mappa category del JSON → category dell'AI
const categoryMap = {
  plumbing: ['plumbing'],
  electric: ['electric'],
  locksmith: ['locksmith'],
  climate: ['climate'],
  gas: ['climate', 'generic', 'plumbing'],
  generic: ['generic', 'plumbing', 'electric', 'locksmith', 'climate'],
};

// ============================================
// NORMALIZZAZIONE TESTO (typos, dialetti, etc.)
// ============================================
function normalizeText(text) {
  let normalized = text.toLowerCase();
  
  // Typos comuni (italiano)
  const typoMap = {
    'alagamento': 'allagamento',
    'alagato': 'allagato',
    'allagametno': 'allagamento',
    'ovuneuqe': 'ovunque',
    'solpito': 'scoppiato',
    'sepozzata': 'spezzata',
    'chisua': 'chiusa',
    'dhenrtoooo': 'dentro',
    'blocataaa': 'bloccata',
    'presaaaa': 'presa',
    'subitoooo': 'subito',
    'aiutoooo': 'aiuto',
    'brucoato': 'bruciato',
    'preseee': 'prese',
    'teremoto': 'terremoto',
    'cascata': 'cascata',
    'bgano': 'bagno',
    'nua': 'una',
    'foco': 'fuoco',
    'semrba': 'sembra',
    'tremamo': 'tremano',
    'apitemi': 'apritemi',
    // Dialetti
    "o'": 'il',
    'guagliò': '',
    'uè': '',
    "mo'": 'ora',
    'na': 'una',
    'de': 'di',
  };
  
  for (const [typo, correct] of Object.entries(typoMap)) {
    normalized = normalized.replace(new RegExp(typo, 'gi'), correct);
  }
  
  // Rimuovi ripetizioni di lettere (es. "aiutoooo" → "aiuto")
  normalized = normalized.replace(/(.)\1{2,}/g, '$1$1');
  
  return normalized;
}

// ============================================
// ANALISI LOCALE (senza chiamare API esterna)
// ============================================
function analyzeMessageLocally(message) {
  const normalizedMessage = normalizeText(message);
  const lowerMessage = normalizedMessage;

  // Determina categoria con keyword espanse (IT + EN)
  let category = 'generic';
  let categoryScore = 0;
  
  const categoryKeywords = {
    gas: {
      keywords: [
        // Italiano
        'gas', 'odore di uova', 'uova marce', 'puzza di gas', 'bombola', 'metano',
        'odore strano', 'gira la testa',
        // Inglese
        'gas smell', 'rotten eggs'
      ],
      weight: 10 // Priorità massima per sicurezza
    },
    plumbing: {
      keywords: [
        // Italiano
        'idraulico', 'acqua', 'tubo', 'perdita', 'scarico', 'rubinetto', 'lavandino', 
        'doccia', 'wc', 'water', 'bidet', 'allagamento', 'allagato', 'goccia', 
        'sifone', 'flessibile', 'boiler', 'spurgo', 'disotturazione', 'otturato',
        'lavastoviglie', 'lavatrice', 'scarica', 'gocciola', 'perde', 'trabocca',
        'autoclave', 'pressione', 'ghiacciatore', 'fognatura', 'piletta', 'riflusso',
        // Inglese
        'water', 'leak', 'plumber', 'pipe', 'drain', 'flooding', 'toilet', 'sink'
      ],
      weight: 5
    },
    electric: {
      keywords: [
        // Italiano
        'elettric', 'luce', 'presa', 'corrente', 'interruttore', 'scintill', 
        'cortocircuito', 'salvavita', 'magnetotermico', 'quadro', 'fili', 'cavi',
        'lampadina', 'led', 'forno', 'televisore', 'tv', 'inverter', 'fotovoltaico',
        'voltaggio', 'tensione', 'volt', 'watt', 'blackout', 'buio', 'salta',
        'sfarfalla', 'lampeggia', 'contatore', 'trifase', 'elettrogeno', 'ascensore',
        'wallbox', 'ricarica', 'gruppo elettrogeno', 'insegna luminosa',
        // Inglese
        'electric', 'power', 'light', 'socket', 'outlet', 'spark', 'charger', 'zap'
      ],
      weight: 5
    },
    locksmith: {
      keywords: [
        // Italiano
        'fabbro', 'serratura', 'chiave', 'chiavi', 'porta', 'bloccato', 'bloccata', 
        'chiuso fuori', 'cassaforte', 'cancello', 'blindata', 'cilindro', 'maniglia',
        'chiuso dentro', 'non esco', 'non entro', 'non riesco ad aprire', 'perso le chiavi',
        'spezzata', 'infilare', 'gira a vuoto', 'serranda', 'basculante', 'garage',
        'spioncino', 'catenella', 'sbarra', 'smart lock', 'nuki', 'tessera',
        // Inglese
        'key', 'keys', 'lock', 'locked', 'door', 'locksmith', 'stuck', 'cant enter',
        'cannot enter', 'lost key', 'lost keys'
      ],
      weight: 5
    },
    climate: {
      keywords: [
        // Italiano
        'clima', 'condizionatore', 'caldaia', 'riscaldamento', 'termosifone', 'split',
        'aria condizionata', 'caldo', 'freddo', 'temperatura', 'frigorifero', 'cella',
        'fan-coil', 'deumidificatore', 'vmc', 'estrazione fumi', 'ventilazione',
        'radiatore', 'calorifero', 'termostato', 'errore e10', 'errore caldaia',
        'pressione caldaia', 'caricamento', 'boiler', 'acqua calda', 'riscalda',
        'raffredda', 'gela', 'ghiaccio', 'soffocando', 'cappa', 'aspirazione',
        'climatizzatore', 'pompa di calore', 'funghi a gas', 'dehor', 'barriere aria',
        'umidità', 'cantina vini', 'server', 'sala server',
        // Inglese  
        'air conditioning', 'ac', 'heater', 'heating', 'cooling', 'thermostat', 'hvac'
      ],
      weight: 5
    },
  };

  // Calcola score per ogni categoria
  const scores = {};
  for (const [cat, config] of Object.entries(categoryKeywords)) {
    scores[cat] = 0;
    for (const keyword of config.keywords) {
      if (lowerMessage.includes(keyword)) {
        scores[cat] += config.weight;
      }
    }
  }

  // Trova categoria con score più alto
  let maxScore = 0;
  for (const [cat, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      category = cat === 'gas' ? 'climate' : cat; // Gas mappato a climate
    }
  }

  // Determina priorità/urgenza con threshold più conservativi
  let priority = 'medium';
  let emergencyScore = 0;
  let highScore = 0;

  // Keywords EMERGENCY - pericolo vita/incendio immediato
  const emergencyKeywords = [
    // Pericolo vita/incendio
    'fuoco', 'incendio', 'fiamme', 'brucia', 'scoppia', 'esplos',
    'gas', 'uova marce', 'metano', 'gira la testa', 'puzza di gas',
    // Persone in pericolo
    'bambino dentro', 'bambino chiuso', 'bambino solo', 'baby inside', 'baby alone',
    'bloccato dentro', 'non riesco a uscire', 'non esco più', 'chiuso dentro',
    'medicinali salvavita', 'scottato', 'scottatura', 'ferito', 'soffocando',
    // Acqua grave
    'allagamento totale', 'cascata', 'schizza tutto', 'esploso il tubo',
    'acqua ovunque', 'acqua bollente',
    // Elettrico grave
    'scintille', 'fumo dalla presa', 'puzza bruciato', 'cavi scoperti',
    'presa bruciata', 'fumo nero',
    // Inglese emergenza
    'fire', 'explosion', 'trapped', 'emergency', 'help me'
  ];
  
  // Keywords HIGH - urgente ma non pericolo vita
  const highKeywords = [
    // Guasti importanti con impatto
    'rotto', 'non funziona', 'guasto', 'saltato', 'in tilt', 'morto',
    'bloccata', 'bloccato', 'ferma', 'fermo', 'non risponde',
    'non si accende', 'non parte', 'non scalda', 'non raffredda',
    // Perdite/danni attivi
    'perdita', 'gocciola', 'allaga', 'riflusso', 'trabocca', 'perde acqua',
    'acqua marrone', 'acqua nera', 'schiuma',
    // Business impact / HORECA
    'hotel', 'ristorante', 'bar', 'clienti', 'ospiti', 'cucina bloccata',
    'produzione ferma', 'evento', 'check-in', 'camera', 'suite',
    'cella frigorifera', 'merce a rischio', 'buffet', 'sala server',
    // Sicurezza / accesso
    'furto', 'ladri', 'manomessa', 'scippato', 'chiuso fuori',
    'chiave spezzata', 'serratura bloccata', 'non riesco ad entrare',
    'porta non si chiude', 'serranda',
    // Freddissimo/caldissimo
    'freddissimo', 'caldissimo', 'gelo', 'soffoca',
    // Inglese high  
    'broken', 'not working', 'flooding', 'urgent', 'asap', 'immediately',
    'cant enter', 'locked out', 'stuck'
  ];
  
  // Keywords LOW - manutenzione programmabile
  const lowKeywords = [
    'preventivo', 'vorrei', 'quanto costa', 'programmare', 'manutenzione',
    'sanificazione', 'pulizia', 'lucidatura', 'installare', 'montare',
    'regolazione', 'registrazione', 'controllo', 'certificazione',
    'quote', 'price', 'schedule', 'maintenance', 'appointment'
  ];

  // Calcola score urgenza
  for (const keyword of emergencyKeywords) {
    if (lowerMessage.includes(keyword)) {
      emergencyScore += 3;
    }
  }
  for (const keyword of highKeywords) {
    if (lowerMessage.includes(keyword)) {
      highScore += 2;
    }
  }

  // Check CAPS LOCK (solo se >60% del messaggio e almeno 20 caratteri)
  const capsChars = (message.match(/[A-Z]/g) || []).length;
  const letterChars = (message.match(/[a-zA-Z]/g) || []).length;
  const capsRatio = letterChars > 20 ? capsChars / letterChars : 0;
  
  if (capsRatio > 0.6) {
    emergencyScore += 5; // Forte indicatore di panico
  }

  // Check punti esclamativi multipli (!!!)
  const exclamations = (message.match(/!{2,}/g) || []).length;
  if (exclamations >= 2) {
    emergencyScore += 2;
  }

  // Check se è LOW priority prima (preventivi, manutenzione programmata)
  let isLowPriority = false;
  for (const keyword of lowKeywords) {
    if (lowerMessage.includes(keyword)) {
      isLowPriority = true;
      break;
    }
  }

  // Determina priorità finale
  if (isLowPriority && emergencyScore < 3 && highScore < 4) {
    // È una richiesta di preventivo/manutenzione, non urgente
    priority = 'low';
  } else if (emergencyScore >= 3) {
    priority = 'emergency';
  } else if (highScore >= 2 || emergencyScore >= 1) {
    priority = 'high';
  } else {
    priority = 'medium';
  }

  return {
    category,
    priority,
    emergency: priority === 'emergency',
    _debug: { scores, emergencyScore, highScore, capsRatio }
  };
}

// ============================================
// VALUTAZIONE RISULTATO
// ============================================
function evaluateResult(input, analysis) {
  const expectedCategories = categoryMap[input.category] || [input.category];
  const categoryMatch = expectedCategories.includes(analysis.category);

  const expectedPriorities = urgencyToPriorityMap[input.urgency] || [input.urgency];
  const urgencyMatch = expectedPriorities.includes(analysis.priority);

  return { categoryMatch, urgencyMatch };
}

// ============================================
// ESECUZIONE TEST
// ============================================
function runTests(options = {}) {
  // Carica i dati di test
  const dataPath = path.join(__dirname, '..', 'simulated_users.json');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  let testCases = JSON.parse(rawData);

  // Filtra per opzioni
  if (options.category) {
    testCases = testCases.filter(tc => tc.category === options.category);
  }
  if (options.urgency) {
    testCases = testCases.filter(tc => tc.urgency === options.urgency);
  }
  if (options.userType) {
    testCases = testCases.filter(tc => tc.user_type.includes(options.userType));
  }
  if (options.limit) {
    testCases = testCases.slice(0, options.limit);
  }

  console.log(`\n🧪 Avvio test su ${testCases.length} casi...\n`);

  const results = [];
  let passedCount = 0;

  // Statistiche
  const byCategory = {};
  const byUrgency = {};
  const byUserType = {};

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const startTime = Date.now();

    const analysis = analyzeMessageLocally(testCase.text);
    const executionTime = Date.now() - startTime;

    const { categoryMatch, urgencyMatch } = evaluateResult(testCase, analysis);
    const passed = categoryMatch && urgencyMatch;

    if (passed) passedCount++;

    // Aggiorna statistiche categoria
    if (!byCategory[testCase.category]) {
      byCategory[testCase.category] = { total: 0, correct: 0 };
    }
    byCategory[testCase.category].total++;
    if (categoryMatch) byCategory[testCase.category].correct++;

    // Aggiorna statistiche urgenza
    if (!byUrgency[testCase.urgency]) {
      byUrgency[testCase.urgency] = { total: 0, correct: 0 };
    }
    byUrgency[testCase.urgency].total++;
    if (urgencyMatch) byUrgency[testCase.urgency].correct++;

    // Aggiorna statistiche user type
    const userTypeKey = testCase.user_type.includes('panic') ? 'panic' : 
                        testCase.user_type.includes('elderly') ? 'elderly' :
                        testCase.user_type.includes('drunk') ? 'drunk' :
                        testCase.user_type.includes('horeca') ? 'horeca' :
                        testCase.user_type.includes('tourist') ? 'tourist' :
                        'private';
    if (!byUserType[userTypeKey]) {
      byUserType[userTypeKey] = { total: 0, correct: 0 };
    }
    byUserType[userTypeKey].total++;
    if (passed) byUserType[userTypeKey].correct++;

    results.push({
      index: i,
      input: testCase,
      analysis,
      categoryMatch,
      urgencyMatch,
      executionTime,
    });
  }

  // Calcola statistiche finali
  const categoryCorrect = results.filter(r => r.categoryMatch).length;
  const urgencyCorrect = results.filter(r => r.urgencyMatch).length;

  return {
    totalTests: testCases.length,
    passed: passedCount,
    failed: testCases.length - passedCount,
    categoryAccuracy: (categoryCorrect / testCases.length) * 100,
    urgencyAccuracy: (urgencyCorrect / testCases.length) * 100,
    byCategory: Object.fromEntries(
      Object.entries(byCategory).map(([k, v]) => [k, { ...v, accuracy: (v.correct / v.total) * 100 }])
    ),
    byUrgency: Object.fromEntries(
      Object.entries(byUrgency).map(([k, v]) => [k, { ...v, accuracy: (v.correct / v.total) * 100 }])
    ),
    byUserType: Object.fromEntries(
      Object.entries(byUserType).map(([k, v]) => [k, { ...v, accuracy: (v.correct / v.total) * 100 }])
    ),
    failedCases: results.filter(r => !r.categoryMatch || !r.urgencyMatch).slice(0, 15),
  };
}

// ============================================
// REPORT FORMATTATO
// ============================================
function printReport(report) {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║          🤖 NIKITUTTOFARE - AI TEST REPORT                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  // Riepilogo generale
  console.log('📊 RIEPILOGO GENERALE');
  console.log('─'.repeat(50));
  console.log(`   Test totali:     ${report.totalTests}`);
  console.log(`   ✅ Passati:       ${report.passed} (${((report.passed / report.totalTests) * 100).toFixed(1)}%)`);
  console.log(`   ❌ Falliti:       ${report.failed}`);
  console.log('');

  // Accuracy per metrica
  console.log('🎯 ACCURACY PER METRICA');
  console.log('─'.repeat(50));
  console.log(`   Categoria:  ${report.categoryAccuracy.toFixed(1)}% ${getAccuracyBar(report.categoryAccuracy)}`);
  console.log(`   Urgenza:    ${report.urgencyAccuracy.toFixed(1)}% ${getAccuracyBar(report.urgencyAccuracy)}`);
  console.log('');

  // Per categoria
  console.log('📁 ACCURACY PER CATEGORIA');
  console.log('─'.repeat(50));
  for (const [cat, stats] of Object.entries(report.byCategory).sort((a, b) => b[1].total - a[1].total)) {
    const bar = getAccuracyBar(stats.accuracy);
    console.log(`   ${cat.padEnd(12)} ${stats.accuracy.toFixed(0).padStart(3)}% ${bar} (${stats.correct}/${stats.total})`);
  }
  console.log('');

  // Per urgenza
  console.log('🚨 ACCURACY PER URGENZA');
  console.log('─'.repeat(50));
  const urgencyOrder = ['emergency', 'high', 'medium', 'low'];
  for (const urgency of urgencyOrder) {
    const stats = report.byUrgency[urgency];
    if (stats) {
      const bar = getAccuracyBar(stats.accuracy);
      const emoji = urgency === 'emergency' ? '🔴' : urgency === 'high' ? '🟠' : urgency === 'medium' ? '🟡' : '🟢';
      console.log(`   ${emoji} ${urgency.padEnd(10)} ${stats.accuracy.toFixed(0).padStart(3)}% ${bar} (${stats.correct}/${stats.total})`);
    }
  }
  console.log('');

  // Per tipo utente
  console.log('👤 ACCURACY PER TIPO UTENTE');
  console.log('─'.repeat(50));
  for (const [userType, stats] of Object.entries(report.byUserType).sort((a, b) => b[1].total - a[1].total)) {
    const bar = getAccuracyBar(stats.accuracy);
    console.log(`   ${userType.padEnd(12)} ${stats.accuracy.toFixed(0).padStart(3)}% ${bar} (${stats.correct}/${stats.total})`);
  }
  console.log('');

  // Casi falliti (campione)
  if (report.failedCases.length > 0) {
    console.log('❌ ESEMPI DI CASI FALLITI (max 10)');
    console.log('─'.repeat(50));
    for (const failedCase of report.failedCases.slice(0, 10)) {
      console.log(`\n   [${failedCase.input.category}/${failedCase.input.urgency}]`);
      console.log(`   Input: "${failedCase.input.text.slice(0, 60)}..."`);
      console.log(`   Rilevato: ${failedCase.analysis.category}/${failedCase.analysis.priority}`);
      console.log(`   Cat: ${failedCase.categoryMatch ? '✅' : '❌'} | Urg: ${failedCase.urgencyMatch ? '✅' : '❌'}`);
    }
  }

  console.log('\n');
  console.log('═'.repeat(60));

  // Verdetto finale
  const overallAccuracy = (report.categoryAccuracy + report.urgencyAccuracy) / 2;
  if (overallAccuracy >= 90) {
    console.log('🏆 ECCELLENTE! L\'AI performa sopra il 90%');
  } else if (overallAccuracy >= 75) {
    console.log('✅ BUONO! L\'AI performa bene, margini di miglioramento');
  } else if (overallAccuracy >= 60) {
    console.log('⚠️  SUFFICIENTE. Necessario migliorare il training');
  } else {
    console.log('❌ INSUFFICIENTE. Revisione urgente necessaria');
  }
  console.log('═'.repeat(60));
}

function getAccuracyBar(accuracy) {
  const filled = Math.round(accuracy / 10);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

// ============================================
// MAIN
// ============================================
function main() {
  const args = process.argv.slice(2);
  const options = {};

  for (const arg of args) {
    if (arg.startsWith('--category=')) {
      options.category = arg.split('=')[1];
    } else if (arg.startsWith('--urgency=')) {
      options.urgency = arg.split('=')[1];
    } else if (arg.startsWith('--user-type=')) {
      options.userType = arg.split('=')[1];
    } else if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1], 10);
    }
  }

  console.log('\n🚀 NikiTuttoFare AI Test Suite');
  console.log('━'.repeat(60));
  
  if (Object.keys(options).length > 0) {
    console.log('Filtri applicati:', JSON.stringify(options));
  }

  const report = runTests(options);
  printReport(report);

  // Salva report JSON
  const reportPath = path.join(__dirname, '..', 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report JSON salvato in: test-report.json`);
}

main();
