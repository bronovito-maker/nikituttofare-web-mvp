#!/usr/bin/env npx ts-node
/**
 * 🧪 NikiTuttoFare - AI Response Test Suite
 * 
 * Questo script testa la qualità delle risposte AI usando scenari simulati.
 * 
 * USO:
 *   npx ts-node scripts/test-ai-responses.ts
 *   npx ts-node scripts/test-ai-responses.ts --category=plumbing
 *   npx ts-node scripts/test-ai-responses.ts --urgency=emergency
 *   npx ts-node scripts/test-ai-responses.ts --limit=10
 */

import * as fs from 'fs';
import * as path from 'path';

// Tipi
interface SimulatedUser {
  category: string;
  urgency: string;
  user_type: string;
  text: string;
  expected_action: string;
}

interface AnalysisResult {
  category: string;
  priority: string;
  shouldCreateTicket: boolean;
  address: string | null;
  emergency: boolean;
  needsMoreInfo: string[];
  responseType: string;
}

interface TestResult {
  index: number;
  input: SimulatedUser;
  analysis: AnalysisResult | null;
  aiResponse: string | null;
  categoryMatch: boolean;
  urgencyMatch: boolean;
  error: string | null;
  executionTime: number;
}

interface TestReport {
  totalTests: number;
  passed: number;
  failed: number;
  errors: number;
  categoryAccuracy: number;
  urgencyAccuracy: number;
  averageResponseTime: number;
  byCategory: Record<string, { total: number; correct: number; accuracy: number }>;
  byUrgency: Record<string, { total: number; correct: number; accuracy: number }>;
  byUserType: Record<string, { total: number; correct: number; accuracy: number }>;
  failedCases: TestResult[];
}

// Mappa urgency del JSON → priority dell'AI
const urgencyToPriorityMap: Record<string, string[]> = {
  emergency: ['emergency', 'high'],
  high: ['high', 'emergency'],
  medium: ['medium', 'high'],
  low: ['low', 'medium'],
};

// Mappa category del JSON → category dell'AI
const categoryMap: Record<string, string[]> = {
  plumbing: ['plumbing'],
  electric: ['electric'],
  locksmith: ['locksmith'],
  climate: ['climate'],
  gas: ['climate', 'generic', 'plumbing'], // gas può essere mappato a climate o generic
  generic: ['generic', 'plumbing', 'electric', 'locksmith', 'climate'],
};

// ============================================
// ANALISI LOCALE (senza chiamare API esterna)
// ============================================
function analyzeMessageLocally(message: string): AnalysisResult {
  const lowerMessage = message.toLowerCase();

  // Determina categoria
  let category = 'generic';
  
  // Ordine di priorità per le keyword
  const categoryKeywords: Record<string, string[]> = {
    gas: ['gas', 'odore di uova', 'uova marce', 'puzza di gas', 'bombola', 'metano'],
    plumbing: ['idraulico', 'acqua', 'tubo', 'perdita', 'scarico', 'rubinetto', 'lavandino', 
               'doccia', 'wc', 'water', 'bidet', 'allagamento', 'allagato', 'goccia', 
               'sifone', 'flessibile', 'caldaia', 'boiler'],
    electric: ['elettric', 'luce', 'presa', 'corrente', 'interruttore', 'scintill', 
               'cortocircuito', 'salvavita', 'magnetotermico', 'quadro', 'fili', 'cavi',
               'lampadina', 'led', 'forno', 'televisore', 'tv'],
    locksmith: ['fabbro', 'serratura', 'chiave', 'porta', 'bloccato', 'bloccata', 'chiuso fuori',
                'cassaforte', 'cancello', 'blindata', 'cilindro', 'maniglia'],
    climate: ['clima', 'condizionatore', 'caldaia', 'riscaldamento', 'termosifone', 'split',
              'aria condizionata', 'caldo', 'freddo', 'temperatura', 'frigorifero', 'cella',
              'fan-coil', 'deumidificatore', 'vmc'],
  };

  // Gas ha priorità massima per sicurezza
  for (const keyword of categoryKeywords.gas) {
    if (lowerMessage.includes(keyword)) {
      category = 'climate'; // gas viene gestito come climate per sicurezza
      break;
    }
  }

  if (category === 'generic') {
    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
      if (cat === 'gas') continue;
      for (const keyword of keywords) {
        if (lowerMessage.includes(keyword)) {
          category = cat;
          break;
        }
      }
      if (category !== 'generic') break;
    }
  }

  // Determina priorità/urgenza
  let priority = 'medium';
  const emergencyKeywords = [
    'aiuto', 'help', 'emergenza', 'urgente', 'subito', 'ora', 'presto',
    'scoppiato', 'esploso', 'fuoco', 'incendio', 'fumo', 'bruciato',
    'allagamento', 'allagato', 'schizza', 'trabocca',
    'bloccato', 'chiuso dentro', 'non esco', 'bambino',
    'paura', 'pericolo', 'scintille', 'puzza di bruciato',
    'gas', 'uova marce', 'bollente', 'scottato'
  ];

  const highKeywords = [
    'rotto', 'non funziona', 'guasto', 'ferma', 'bloccata',
    'perdita', 'gocciola', 'saltato', 'in tilt',
    'hotel', 'ristorante', 'bar', 'clienti'
  ];

  // Check per caps lock (indica panico)
  const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length;
  if (capsRatio > 0.5) {
    priority = 'emergency';
  } else {
    for (const keyword of emergencyKeywords) {
      if (lowerMessage.includes(keyword)) {
        priority = 'emergency';
        break;
      }
    }

    if (priority === 'medium') {
      for (const keyword of highKeywords) {
        if (lowerMessage.includes(keyword)) {
          priority = 'high';
          break;
        }
      }
    }
  }

  // Estrai indirizzo
  let address: string | null = null;
  const addressMatch = lowerMessage.match(/(?:via|corso|piazza|viale)\s+[^,\.]+/i);
  if (addressMatch) {
    address = addressMatch[0];
  }

  return {
    category,
    priority,
    shouldCreateTicket: true,
    address,
    emergency: priority === 'emergency',
    needsMoreInfo: [],
    responseType: 'text',
  };
}

// ============================================
// VALUTAZIONE RISULTATO
// ============================================
function evaluateResult(input: SimulatedUser, analysis: AnalysisResult): { categoryMatch: boolean; urgencyMatch: boolean } {
  // Verifica categoria
  const expectedCategories = categoryMap[input.category] || [input.category];
  const categoryMatch = expectedCategories.includes(analysis.category);

  // Verifica urgenza
  const expectedPriorities = urgencyToPriorityMap[input.urgency] || [input.urgency];
  const urgencyMatch = expectedPriorities.includes(analysis.priority);

  return { categoryMatch, urgencyMatch };
}

// ============================================
// ESECUZIONE TEST
// ============================================
async function runTests(options: {
  category?: string;
  urgency?: string;
  userType?: string;
  limit?: number;
}): Promise<TestReport> {
  // Carica i dati di test
  const dataPath = path.join(__dirname, '..', 'simulated_users.json');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  let testCases: SimulatedUser[] = JSON.parse(rawData);

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
  console.log('━'.repeat(60));

  const results: TestResult[] = [];
  let passedCount = 0;
  let errorCount = 0;

  // Statistiche per categoria
  const byCategory: Record<string, { total: number; correct: number }> = {};
  const byUrgency: Record<string, { total: number; correct: number }> = {};
  const byUserType: Record<string, { total: number; correct: number }> = {};

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const startTime = Date.now();

    try {
      // Analizza localmente
      const analysis = analyzeMessageLocally(testCase.text);
      const executionTime = Date.now() - startTime;

      // Valuta risultato
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
      const userTypeKey = testCase.user_type.split('_')[0]; // Prendi prima parte
      if (!byUserType[userTypeKey]) {
        byUserType[userTypeKey] = { total: 0, correct: 0 };
      }
      byUserType[userTypeKey].total++;
      if (passed) byUserType[userTypeKey].correct++;

      // Icona risultato
      const icon = passed ? '✅' : (categoryMatch ? '⚠️' : '❌');
      
      // Log progress ogni 20 test
      if ((i + 1) % 20 === 0 || i === testCases.length - 1) {
        console.log(`[${i + 1}/${testCases.length}] Processati...`);
      }

      results.push({
        index: i,
        input: testCase,
        analysis,
        aiResponse: null,
        categoryMatch,
        urgencyMatch,
        error: null,
        executionTime,
      });

    } catch (error) {
      errorCount++;
      results.push({
        index: i,
        input: testCase,
        analysis: null,
        aiResponse: null,
        categoryMatch: false,
        urgencyMatch: false,
        error: error instanceof Error ? error.message : 'Errore sconosciuto',
        executionTime: Date.now() - startTime,
      });
    }
  }

  // Calcola statistiche finali
  const totalTime = results.reduce((sum, r) => sum + r.executionTime, 0);
  const categoryCorrect = results.filter(r => r.categoryMatch).length;
  const urgencyCorrect = results.filter(r => r.urgencyMatch).length;

  // Converti statistiche con accuracy
  const byCategoryWithAccuracy = Object.fromEntries(
    Object.entries(byCategory).map(([k, v]) => [k, { ...v, accuracy: (v.correct / v.total) * 100 }])
  );
  const byUrgencyWithAccuracy = Object.fromEntries(
    Object.entries(byUrgency).map(([k, v]) => [k, { ...v, accuracy: (v.correct / v.total) * 100 }])
  );
  const byUserTypeWithAccuracy = Object.fromEntries(
    Object.entries(byUserType).map(([k, v]) => [k, { ...v, accuracy: (v.correct / v.total) * 100 }])
  );

  return {
    totalTests: testCases.length,
    passed: passedCount,
    failed: testCases.length - passedCount - errorCount,
    errors: errorCount,
    categoryAccuracy: (categoryCorrect / testCases.length) * 100,
    urgencyAccuracy: (urgencyCorrect / testCases.length) * 100,
    averageResponseTime: totalTime / testCases.length,
    byCategory: byCategoryWithAccuracy,
    byUrgency: byUrgencyWithAccuracy,
    byUserType: byUserTypeWithAccuracy,
    failedCases: results.filter(r => !r.categoryMatch || !r.urgencyMatch).slice(0, 20), // Max 20 fallimenti
  };
}

// ============================================
// REPORT FORMATTATO
// ============================================
function printReport(report: TestReport) {
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
  console.log(`   ⚠️  Errori:        ${report.errors}`);
  console.log(`   ⏱️  Tempo medio:   ${report.averageResponseTime.toFixed(0)}ms`);
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
    console.log(`   ${cat.padEnd(12)} ${stats.accuracy.toFixed(0)}% ${bar} (${stats.correct}/${stats.total})`);
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
      console.log(`   ${emoji} ${urgency.padEnd(10)} ${stats.accuracy.toFixed(0)}% ${bar} (${stats.correct}/${stats.total})`);
    }
  }
  console.log('');

  // Per tipo utente
  console.log('👤 ACCURACY PER TIPO UTENTE');
  console.log('─'.repeat(50));
  for (const [userType, stats] of Object.entries(report.byUserType).sort((a, b) => b[1].total - a[1].total)) {
    const bar = getAccuracyBar(stats.accuracy);
    console.log(`   ${userType.padEnd(12)} ${stats.accuracy.toFixed(0)}% ${bar} (${stats.correct}/${stats.total})`);
  }
  console.log('');

  // Casi falliti (campione)
  if (report.failedCases.length > 0) {
    console.log('❌ ESEMPI DI CASI FALLITI');
    console.log('─'.repeat(50));
    for (const failedCase of report.failedCases.slice(0, 5)) {
      console.log(`\n   [${failedCase.input.category}/${failedCase.input.urgency}] ${failedCase.input.user_type}`);
      console.log(`   Input: "${failedCase.input.text.slice(0, 80)}..."`);
      if (failedCase.analysis) {
        console.log(`   Rilevato: ${failedCase.analysis.category}/${failedCase.analysis.priority}`);
        console.log(`   Cat: ${failedCase.categoryMatch ? '✅' : '❌'} | Urg: ${failedCase.urgencyMatch ? '✅' : '❌'}`);
      }
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

function getAccuracyBar(accuracy: number): string {
  const filled = Math.round(accuracy / 10);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

// ============================================
// MAIN
// ============================================
async function main() {
  // Parse arguments
  const args = process.argv.slice(2);
  const options: {
    category?: string;
    urgency?: string;
    userType?: string;
    limit?: number;
  } = {};

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

  try {
    const report = await runTests(options);
    printReport(report);

    // Salva report JSON
    const reportPath = path.join(__dirname, '..', 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report JSON salvato in: ${reportPath}`);

  } catch (error) {
    console.error('❌ Errore durante l\'esecuzione dei test:', error);
    process.exit(1);
  }
}

main();
