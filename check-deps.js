// check-deps.js
const fs = require('fs');
const path = require('path');

console.log('--- Avvio Diagnostica Dipendenze RistoAI ---');

const checkFile = (filePath) => {
  return fs.existsSync(filePath) ? `TROVATO (${filePath})` : `NON TROVATO (${filePath})`;
};

// --- 1. Controllo Versione AI (package.json) ---
try {
  const pkgPath = path.resolve(__dirname, 'node_modules/ai/package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = require(pkgPath);
    console.log(`\n[Diagnosi 1] Versione 'ai' in node_modules: ${pkg.version}`);
    if (pkg.version.startsWith('3')) {
      console.error('  -> ERRORE: Trovata v3.x. Il package-lock è ignorato.');
    } else {
      console.log('  -> OK: Versione v2.x rilevata, come da package.json.');
    }

    // --- 2. Controllo 'exports' in package.json ---
    console.log('\n[Diagnosi 2] Controllo "exports" per "ai/react":');
    if (pkg.exports && pkg.exports['./react']) {
      console.log('  -> OK: La chiave "./react" esiste negli exports.');
      console.log(JSON.stringify(pkg.exports['./react'], null, 2));
    } else {
      console.error('  -> ERRORE: La chiave "./react" NON esiste! Questo causa il Build Error.');
    }
  } else {
    console.error("\n[Diagnosi 1] ERRORE: 'node_modules/ai/package.json' non trovato.");
  }
} catch (err) {
  console.error('\n[Diagnosi 1/2] Fallimento catastrofico nel leggere package.json:', err.message);
}

// --- 3. Test Risoluzione Modulo (require.resolve) ---
console.log('\n[Diagnosi 3] Tentativo di risolvere "ai/react" (come farebbe Webpack):');
try {
  const resolvedPath = require.resolve('ai/react');
  console.log(`  -> OK: Modulo risolto correttamente: ${resolvedPath}`);
} catch (err) {
  console.error(`  -> ERRORE: require.resolve('ai/react') fallito!`, err.message);
  console.error('  -> Questo è il motivo del fallimento della build.');
}

// --- 4. Controllo Cache Nascoste (suggerite da ChatGPT) ---
console.log('\n[Diagnosi 4] Controllo cache comuni:');
const home = process.env.HOME || process.env.USERPROFILE;
console.log(`- Cache NPM (macOS/Linux): ${checkFile(path.join(home, '.npm', '_cacache'))}`);
console.log(`- Cache NPM (Legacy macOS): ${checkFile(path.join(home, 'Library', 'Caches', 'npm'))}`);
console.log(`- Cache Webpack: ${checkFile(path.resolve(__dirname, 'node_modules', '.cache', 'webpack'))}`);
console.log(`- Cache Next.js: ${checkFile(path.resolve(__dirname, '.next'))}`);

console.log('\n--- Diagnostica Completata ---');