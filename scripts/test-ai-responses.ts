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

import * as fs from 'node:fs';
import * as path from 'node:path';

// Resolve script directory in both CJS and ESM runtimes
const scriptPath = process.argv[1] ? path.resolve(process.argv[1]) : path.resolve('scripts/test-ai-responses.ts');
const __dirname = path.dirname(scriptPath);

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
const categoryKeywords: Record<string, string[]> = {
  gas: ['gas', 'odore di uova', 'uova marce', 'puzza di gas', 'bombola', 'metano'],
  plumbing: ['idraulico', 'acqua', 'tubo', 'perdita', 'scarico', 'rubinetto', 'lavandino', 'doccia', 'wc', 'water', 'bidet', 'allagamento', 'allagato', 'goccia', 'sifone', 'flessibile', 'caldaia', 'boiler'],
  electric: ['elettric', 'luce', 'presa', 'corrente', 'interruttore', 'scintill', 'cortocircuito', 'salvavita', 'magnetotermico', 'quadro', 'fili', 'cavi', 'lampadina', 'led', 'forno', 'televisore', 'tv'],
  locksmith: ['fabbro', 'serratura', 'chiave', 'porta', 'bloccato', 'bloccata', 'chiuso fuori', 'cassaforte', 'cancello', 'blindata', 'cilindro', 'maniglia'],
  climate: ['clima', 'condizionatore', 'caldaia', 'riscaldamento', 'termosifone', 'split', 'aria condizionata', 'caldo', 'freddo', 'temperatura', 'frigorifero', 'cella', 'fan-coil', 'deumidificatore', 'vmc'],
};

const emergencyKeywords = ['aiuto', 'help', 'emergenza', 'urgente', 'subito', 'ora', 'presto', 'scoppiato', 'esploso', 'fuoco', 'incendio', 'fumo', 'bruciato', 'allagamento', 'allagato', 'schizza', 'trabocca', 'bloccato', 'chiuso dentro', 'non esco', 'bambino', 'paura', 'pericolo', 'scintille', 'puzza di bruciato', 'gas', 'uova marce', 'bollente', 'scottato'];
const highKeywords = ['rotto', 'non funziona', 'guasto', 'ferma', 'bloccata', 'perdita', 'gocciola', 'saltato', 'in tilt', 'hotel', 'ristorante', 'bar', 'clienti'];

function determineCategory(lowerMessage: string): string {
  if (categoryKeywords.gas.some(kw => lowerMessage.includes(kw))) {
    return 'climate';
  }
  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    if (cat !== 'gas' && keywords.some(kw => lowerMessage.includes(kw))) {
      return cat;
    }
  }
  return 'generic';
}

function determinePriority(lowerMessage: string, originalMessage: string): string {
  const capsRatio = (originalMessage.match(/[A-Z]/g) || []).length / originalMessage.length;
  if (capsRatio > 0.5) return 'emergency';
  if (emergencyKeywords.some(kw => lowerMessage.includes(kw))) return 'emergency';
  if (highKeywords.some(kw => lowerMessage.includes(kw))) return 'high';
  return 'medium';
}

function extractAddress(lowerMessage: string): string | null {
  const addressMatch = /(?:via|corso|piazza|viale)\s+[^,.]+/.exec(lowerMessage);
  return addressMatch ? addressMatch[0] : null;
}

function analyzeMessageLocally(message: string): AnalysisResult {
  const lowerMessage = message.toLowerCase();
  const category = determineCategory(lowerMessage);
  const priority = determinePriority(lowerMessage, message);
  const address = extractAddress(lowerMessage);

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
function filterTestCases(testCases: SimulatedUser[], options: { category?: string; urgency?: string; userType?: string; limit?: number; }): SimulatedUser[] {
  let filtered = testCases;
  if (options.category) {
    filtered = filtered.filter(tc => tc.category === options.category);
  }
  if (options.urgency) {
    filtered = filtered.filter(tc => tc.urgency === options.urgency);
  }
  if (options.userType) {
    filtered = filtered.filter(tc => tc.user_type === options.userType);
  }
  if (options.limit) {
    filtered = filtered.slice(0, options.limit);
  }
  return filtered;
}

function processTestCase(testCase: SimulatedUser, index: number): TestResult {
  const startTime = Date.now();
  try {
    const analysis = analyzeMessageLocally(testCase.text);
    const executionTime = Date.now() - startTime;
    const { categoryMatch, urgencyMatch } = evaluateResult(testCase, analysis);

    return {
      index,
      input: testCase,
      analysis,
      aiResponse: null,
      categoryMatch,
      urgencyMatch,
      error: null,
      executionTime,
    };
  } catch (error) {
    return {
      index,
      input: testCase,
      analysis: null,
      aiResponse: null,
      categoryMatch: false,
      urgencyMatch: false,
      error: error instanceof Error ? error.message : 'Errore sconosciuto',
      executionTime: Date.now() - startTime,
    };
  }
}

function updateSingleStat(stats: any, key: string, match: boolean) {
  if (!stats[key]) {
    stats[key] = { total: 0, correct: 0 };
  }
  stats[key].total++;
  if (match) {
    stats[key].correct++;
  }
}

function updateAllStats(stats: any, results: TestResult[]) {
  for (const result of results) {
    const { input, categoryMatch, urgencyMatch } = result;
    const passed = categoryMatch && urgencyMatch;
    updateSingleStat(stats.byCategory, input.category, categoryMatch);
    updateSingleStat(stats.byUrgency, input.urgency, urgencyMatch);
    const userTypeKey = input.user_type.split('_')[0];
    updateSingleStat(stats.byUserType, userTypeKey, passed);
  }
}

function calculateFinalReport(results: TestResult[], totalTests: number): TestReport {
  const passedCount = results.filter(r => r.categoryMatch && r.urgencyMatch).length;
  const errorCount = results.filter(r => r.error).length;
  const totalTime = results.reduce((sum, r) => sum + r.executionTime, 0);
  const categoryCorrect = results.filter(r => r.categoryMatch).length;
  const urgencyCorrect = results.filter(r => r.urgencyMatch).length;

  const stats = { byCategory: {}, byUrgency: {}, byUserType: {} };
  updateAllStats(stats, results);

  const byCategoryWithAccuracy = Object.fromEntries(Object.entries(stats.byCategory).map(([k, v]: [string, any]) => [k, { ...v, accuracy: (v.correct / v.total) * 100 }]));
  const byUrgencyWithAccuracy = Object.fromEntries(Object.entries(stats.byUrgency).map(([k, v]: [string, any]) => [k, { ...v, accuracy: (v.correct / v.total) * 100 }]));
  const byUserTypeWithAccuracy = Object.fromEntries(Object.entries(stats.byUserType).map(([k, v]: [string, any]) => [k, { ...v, accuracy: (v.correct / v.total) * 100 }]));

  return {
    totalTests,
    passed: passedCount,
    failed: totalTests - passedCount - errorCount,
    errors: errorCount,
    categoryAccuracy: (categoryCorrect / totalTests) * 100,
    urgencyAccuracy: (urgencyCorrect / totalTests) * 100,
    averageResponseTime: totalTime / totalTests,
    byCategory: byCategoryWithAccuracy,
    byUrgency: byUrgencyWithAccuracy,
    byUserType: byUserTypeWithAccuracy,
    failedCases: results.filter(r => !r.categoryMatch || !r.urgencyMatch).slice(0, 20),
  };
}


async function runTests(options: {
  category?: string;
  urgency?: string;
  userType?: string;
  limit?: number;
}): Promise<TestReport> {
  const dataPath = path.join(__dirname, '..', 'simulated_users.json');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const testCases: SimulatedUser[] = JSON.parse(rawData);

  const filteredTestCases = filterTestCases(testCases, options);

  console.log(`\n🧪 Avvio test su ${filteredTestCases.length} casi...\n`);
  console.log('━'.repeat(60));

  const results = filteredTestCases.map((tc, i) => processTestCase(tc, i));

  return calculateFinalReport(results, filteredTestCases.length);
}

// ============================================
// REPORT FORMATTATO
// ============================================
function printGeneralSummary(report: TestReport) {
  console.log('📊 RIEPILOGO GENERALE');
  console.log('─'.repeat(50));
  console.log(`   Test totali:     ${report.totalTests}`);
  console.log(`   ✅ Passati:       ${report.passed} (${((report.passed / report.totalTests) * 100).toFixed(1)}%)`);
  console.log(`   ❌ Falliti:       ${report.failed}`);
  console.log(`   ⚠️  Errori:        ${report.errors}`);
  console.log(`   ⏱️  Tempo medio:   ${report.averageResponseTime.toFixed(0)}ms`);
  console.log('');
}

function printMetricsAccuracy(report: TestReport) {
  console.log('🎯 ACCURACY PER METRICA');
  console.log('─'.repeat(50));
  console.log(`   Categoria:  ${report.categoryAccuracy.toFixed(1)}% ${getAccuracyBar(report.categoryAccuracy)}`);
  console.log(`   Urgenza:    ${report.urgencyAccuracy.toFixed(1)}% ${getAccuracyBar(report.urgencyAccuracy)}`);
  console.log('');
}

function getEmojiForCategory(title: string, key: string): string {
  if (!title.includes('URGENZA')) return '';
  switch (key) {
    case 'emergency': return '🔴';
    case 'high': return '🟠';
    case 'medium': return '🟡';
    default: return '🟢';
  }
}

function printDetailedAccuracy(title: string, data: any, order?: string[]) {
  console.log(title);
  console.log('─'.repeat(50));

  const sortedEntries = order
    ? order.map(key => [key, data[key]]).filter(([, v]) => v) as [string, any][]
    : Object.entries(data).sort((a: any, b: any) => b[1].total - a[1].total) as [string, any][];

  for (const [key, stats] of sortedEntries) {
    const bar = getAccuracyBar(stats.accuracy);
    const emoji = getEmojiForCategory(title, key);
    console.log(`   ${emoji} ${key.padEnd(12)} ${stats.accuracy.toFixed(0)}% ${bar} (${stats.correct}/${stats.total})`);
  }
  console.log('');
}

function printFailedCases(failedCases: TestResult[]) {
  if (failedCases.length === 0) return;
  console.log('❌ ESEMPI DI CASI FALLITI');
  console.log('─'.repeat(50));
  for (const failedCase of failedCases.slice(0, 5)) {
    console.log(`\n   [${failedCase.input.category}/${failedCase.input.urgency}] ${failedCase.input.user_type}`);
    console.log(`   Input: "${failedCase.input.text.slice(0, 80)}..."`);
    if (failedCase.analysis) {
      console.log(`   Rilevato: ${failedCase.analysis.category}/${failedCase.analysis.priority}`);
      console.log(`   Cat: ${failedCase.categoryMatch ? '✅' : '❌'} | Urg: ${failedCase.urgencyMatch ? '✅' : '❌'}`);
    }
  }
}

function printFinalVerdict(report: TestReport) {
  console.log('\n');
  console.log('═'.repeat(60));

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

function printReport(report: TestReport) {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║          🤖 NIKITUTTOFARE - AI TEST REPORT                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  printGeneralSummary(report);
  printMetricsAccuracy(report);
  printDetailedAccuracy('📁 ACCURACY PER CATEGORIA', report.byCategory);
  printDetailedAccuracy('🚨 ACCURACY PER URGENZA', report.byUrgency, ['emergency', 'high', 'medium', 'low']);
  printDetailedAccuracy('👤 ACCURACY PER TIPO UTENTE', report.byUserType);
  printFailedCases(report.failedCases);
  printFinalVerdict(report);
}

function getAccuracyBar(accuracy: number): string {
  const filled = Math.round(accuracy / 10);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

// ============================================
// MAIN
// ============================================
function parseCliOptions(args: string[]): { category?: string; urgency?: string; userType?: string; limit?: number; } {
  const options: { category?: string; urgency?: string; userType?: string; limit?: number; } = {};

  for (const arg of args) {
    if (arg.startsWith('--category=')) {
      options.category = arg.split('=')[1];
    } else if (arg.startsWith('--urgency=')) {
      options.urgency = arg.split('=')[1];
    } else if (arg.startsWith('--user-type=')) {
      options.userType = arg.split('=')[1];
    } else if (arg.startsWith('--limit=')) {
      options.limit = Number.parseInt(arg.split('=')[1], 10);
    }
  }
  return options;
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));

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

void main();
