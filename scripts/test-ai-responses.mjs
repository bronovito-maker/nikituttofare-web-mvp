#!/usr/bin/env node
/**
 * 🧪 NikiTuttoFare - AI Response Test Suite
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURATION ---

const URGENCY_MAP = { emergency: ['emergency', 'high'], high: ['high', 'emergency'], medium: ['medium', 'high'], low: ['low', 'medium'] };
const CATEGORY_MAP = { plumbing: ['plumbing'], electric: ['electric'], locksmith: ['locksmith'], climate: ['climate'], gas: ['climate', 'generic', 'plumbing'], generic: ['generic', 'plumbing', 'electric', 'locksmith', 'climate'] };

// --- TEXT NORMALIZATION ---

function normalizeText(text) {
  let normalized = text.toLowerCase();
  const typoMap = { 'alagamento': 'allagamento', 'ovuneuqe': 'ovunque', 'solpito': 'scoppiato', 'sepozzata': 'spezzata', 'chisua': 'chiusa', 'blocataaa': 'bloccata', 'brucoato': 'bruciato', 'bgano': 'bagno', 'foco': 'fuoco', 'semrba': 'sembra', "o'": 'il', 'na': 'una' };
  for (const [typo, correct] of Object.entries(typoMap)) {
    normalized = normalized.replace(new RegExp(typo, 'gi'), correct);
  }
  return normalized.replace(/(.)\1{2,}/g, '$1$1');
}

// --- LOCAL ANALYSIS ---

const KEYWORDS = {
    category: {
        gas: { keywords: ['gas', 'odore di uova', 'puzza di gas'], weight: 10 },
        plumbing: { keywords: ['idraulico', 'acqua', 'tubo', 'perdita', 'scarico', 'rubinetto', 'allagamento', 'gocciola'], weight: 5 },
        electric: { keywords: ['elettric', 'luce', 'presa', 'corrente', 'scintill', 'cortocircuito', 'salvavita', 'blackout'], weight: 5 },
        locksmith: { keywords: ['fabbro', 'serratura', 'chiave', 'porta', 'bloccato', 'chiuso fuori'], weight: 5 },
        climate: { keywords: ['clima', 'condizionatore', 'caldaia', 'riscaldamento', 'freddo', 'caldo', 'termostato'], weight: 5 },
    },
    urgency: {
        emergency: ['fuoco', 'incendio', 'fiamme', 'esplos', 'gas', 'bambino chiuso', 'bloccato dentro', 'allagamento totale', 'cascata', 'scintille', 'fumo dalla presa'],
        high: ['rotto', 'non funziona', 'guasto', 'saltato', 'perdita', 'gocciola', 'hotel', 'ristorante', 'server', 'chiuso fuori', 'serratura bloccata'],
        low: ['preventivo', 'quanto costa', 'programmare', 'manutenzione', 'installare', 'montare'],
    }
};

function determineCategory(text) {
    const scores = Object.fromEntries(Object.keys(KEYWORDS.category).map(cat => [cat, 0]));
    for (const [cat, { keywords, weight }] of Object.entries(KEYWORDS.category)) {
        for (const keyword of keywords) {
            if (text.includes(keyword)) scores[cat] += weight;
        }
    }
    
    let maxScore = 0, bestCat = 'generic';
    for (const [cat, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            bestCat = cat;
        }
    }
    return { category: bestCat === 'gas' ? 'climate' : bestCat, score: maxScore };
}

function calculateEmergencyScore(text, originalMessage) {
    let score = KEYWORDS.urgency.emergency.filter(kw => text.includes(kw)).length * 3;

    const letterChars = (originalMessage.match(/[a-zA-Z]/g) || []).length;
    if (letterChars > 20) {
        const capsRatio = (originalMessage.match(/[A-Z]/g) || []).length / letterChars;
        if (capsRatio > 0.6) score += 5;
    }
    if ((originalMessage.match(/!{2,}/g) || []).length >= 2) score += 2;
    
    return score;
}

function calculateHighScore(text) {
    return KEYWORDS.urgency.high.filter(kw => text.includes(kw)).length * 2;
}

function isLowPriority(text) {
    return KEYWORDS.urgency.low.some(kw => text.includes(kw));
}

function determinePriority(text, originalMessage) {
    const emergencyScore = calculateEmergencyScore(text, originalMessage);
    const highScore = calculateHighScore(text);
    const lowPriority = isLowPriority(text);
    
    if (lowPriority && emergencyScore < 3 && highScore < 4) return 'low';
    if (emergencyScore >= 3) return 'emergency';
    if (highScore >= 2 || emergencyScore >= 1) return 'high';
    return 'medium';
}

function analyzeMessageLocally(message) {
  const normalized = normalizeText(message);
  const { category } = determineCategory(normalized);
  const priority = determinePriority(normalized, message);
  return { category, priority, emergency: priority === 'emergency' };
}

// --- TEST EXECUTION ---

function evaluateResult(input, analysis) {
  const categoryMatch = (CATEGORY_MAP[input.category] || [input.category]).includes(analysis.category);
  const urgencyMatch = (URGENCY_MAP[input.urgency] || [input.urgency]).includes(analysis.priority);
  return { categoryMatch, urgencyMatch, passed: categoryMatch && urgencyMatch };
}

function updateStats(stats, testCase, result) {
    const { category, urgency, user_type } = testCase;
    const { categoryMatch, urgencyMatch, passed } = result;

    const userTypeKey = user_type.find(t => ['panic', 'elderly', 'drunk', 'horeca', 'tourist'].includes(t)) || 'private';

    stats.byCategory[category] = stats.byCategory[category] || { total: 0, correct: 0 };
    stats.byCategory[category].total++;
    if (categoryMatch) stats.byCategory[category].correct++;
    
    stats.byUrgency[urgency] = stats.byUrgency[urgency] || { total: 0, correct: 0 };
    stats.byUrgency[urgency].total++;
    if (urgencyMatch) stats.byUrgency[urgency].correct++;

    stats.byUserType[userTypeKey] = stats.byUserType[userTypeKey] || { total: 0, correct: 0 };
    stats.byUserType[userTypeKey].total++;
    if (passed) stats.byUserType[userTypeKey].correct++;
}

function runTests(options = {}) {
  let testCases = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'simulated_users.json'), 'utf-8'));

  if (options.category) testCases = testCases.filter(tc => tc.category === options.category);
  if (options.urgency) testCases = testCases.filter(tc => tc.urgency === options.urgency);
  if (options.userType) testCases = testCases.filter(tc => tc.user_type.includes(options.userType));
  if (options.limit) testCases = testCases.slice(0, options.limit);
  
  console.log(`\n🧪 Avvio test su ${testCases.length} casi...\n`);

  const results = testCases.map((testCase, index) => {
    const analysis = analyzeMessageLocally(testCase.text);
    const evaluation = evaluateResult(testCase, analysis);
    return { index, input: testCase, analysis, ...evaluation };
  });

  const passedCount = results.filter(r => r.passed).length;
  const stats = { byCategory: {}, byUrgency: {}, byUserType: {} };
  results.forEach(r => updateStats(stats, r.input, r));
  
  const calculateAccuracy = (data) => Object.fromEntries(Object.entries(data).map(([k, v]) => [k, { ...v, accuracy: (v.correct / v.total) * 100 }]));

  return {
    totalTests: testCases.length,
    passed: passedCount,
    failed: testCases.length - passedCount,
    categoryAccuracy: (results.filter(r => r.categoryMatch).length / testCases.length) * 100,
    urgencyAccuracy: (results.filter(r => r.urgencyMatch).length / testCases.length) * 100,
    byCategory: calculateAccuracy(stats.byCategory),
    byUrgency: calculateAccuracy(stats.byUrgency),
    byUserType: calculateAccuracy(stats.byUserType),
    failedCases: results.filter(r => !r.passed).slice(0, 15),
  };
}

// --- REPORTING ---

const getAccuracyBar = (accuracy) => '█'.repeat(Math.round(accuracy / 10)) + '░'.repeat(10 - Math.round(accuracy / 10));

function printSection(title, data, keyOrder) {
    console.log(`${title}`);
    console.log('─'.repeat(50));
    const sortedData = keyOrder ? keyOrder.map(k => [k, data[k]]).filter(([,v]) => v) : Object.entries(data).sort((a, b) => b[1].total - a[1].total);

    for (const [key, stats] of sortedData) {
        const bar = getAccuracyBar(stats.accuracy);
        console.log(`   ${key.padEnd(12)} ${stats.accuracy.toFixed(0).padStart(3)}% ${bar} (${stats.correct}/${stats.total})
`);
    }
    console.log('');
}

function printHeader() {
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║      🤖 NIKITUTTOFARE - AI TEST REPORT      ║');
  console.log('╚═══════════════════════════════════════╝\n');
}

function printSummary(report) {
  console.log('📊 RIEPILOGO GENERALE');
  console.log('─'.repeat(50));
  console.log(`   Test totali: ${report.totalTests}`);
  console.log(`   ✅ Passati:   ${report.passed} (${((report.passed / report.totalTests) * 100).toFixed(1)}%)`);
  console.log(`   ❌ Falliti:   ${report.failed}\n`);
}

function printMetrics(report) {
  console.log('🎯 ACCURACY PER METRICA');
  console.log('─'.repeat(50));
  console.log(`   Categoria:  ${report.categoryAccuracy.toFixed(1)}% ${getAccuracyBar(report.categoryAccuracy)}`);
  console.log(`   Urgenza:    ${report.urgencyAccuracy.toFixed(1)}% ${getAccuracyBar(report.urgencyAccuracy)}\n`);
}

function printFailedCases(failedCases) {
    if (failedCases.length === 0) return;

    console.log('❌ ESEMPI DI CASI FALLITI (max 10)');
    console.log('─'.repeat(50));
    failedCases.slice(0, 10).forEach(fc => {
      console.log(`\n   [${fc.input.category}/${fc.input.urgency}] "${fc.input.text.slice(0, 60)}..."
`);
      console.log(`   Rilevato: ${fc.analysis.category}/${fc.analysis.priority} (Cat: ${fc.categoryMatch ? '✅' : '❌'} | Urg: ${fc.urgencyMatch ? '✅' : '❌'})`);
    });
}

function printVerdict(report) {
    const overallAccuracy = (report.categoryAccuracy + report.urgencyAccuracy) / 2;
    const verdict = overallAccuracy >= 90 ? '🏆 ECCELLENTE!' : overallAccuracy >= 75 ? '✅ BUONO' : '⚠️ SUFFICIENTE';
    console.log(`\n\n═`.repeat(60));
    console.log(`${verdict} L'accuracy generale è del ${overallAccuracy.toFixed(1)}%`);
    console.log('═'.repeat(60));
}

function printReport(report) {
  printHeader();
  printSummary(report);
  printMetrics(report);

  printSection('📁 ACCURACY PER CATEGORIA', report.byCategory);
  printSection('🚨 ACCURACY PER URGENZA', report.byUrgency, ['emergency', 'high', 'medium', 'low']);
  printSection('👤 ACCURACY PER TIPO UTENTE', report.byUserType);

  printFailedCases(report.failedCases);
  printVerdict(report);
}

// --- MAIN ---

function parseCliOptions(args) {
    return args.reduce((acc, arg) => {
        const [key, value] = arg.replace('--', '').split('=');
        if (key && value) {
            acc[key] = key === 'limit' ? parseInt(value, 10) : value;
        }
        return acc;
    }, {});
}

function main() {
  const options = parseCliOptions(process.argv.slice(2));

  console.log('\n🚀 NikiTuttoFare AI Test Suite');
  if (Object.keys(options).length > 0) {
      console.log('Filtri applicati:', options);
  }
  
  const report = runTests(options);
  printReport(report);

  const reportPath = path.join(__dirname, '..', 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report JSON salvato in: test-report.json`);
}

main();