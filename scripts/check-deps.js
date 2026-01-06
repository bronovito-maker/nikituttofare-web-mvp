// scripts/check-deps.js
// Script per verificare che tutte le dipendenze necessarie siano installate

const fs = require('fs');
const path = require('path');

const requiredDeps = [
  '@supabase/supabase-js',
  'next',
  'react',
  'react-dom',
];

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');

console.log('🔍 Verifica dipendenze...\n');

// Verifica che package.json esista
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ package.json non trovato!');
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const allDeps = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
};

// Verifica che node_modules esista
if (!fs.existsSync(nodeModulesPath)) {
  console.error('❌ node_modules non trovato!');
  console.log('\n💡 Soluzione: Esegui "npm install"');
  process.exit(1);
}

let allOk = true;

// Verifica ogni dipendenza richiesta
for (const dep of requiredDeps) {
  const depPath = path.join(nodeModulesPath, dep);
  const inPackageJson = dep in allDeps;

  if (!inPackageJson) {
    console.error(`❌ ${dep} non trovato in package.json`);
    allOk = false;
  } else if (!fs.existsSync(depPath)) {
    console.error(`❌ ${dep} non installato in node_modules`);
    console.log(`   Versione richiesta: ${allDeps[dep]}`);
    allOk = false;
  } else {
    console.log(`✅ ${dep} installato (${allDeps[dep]})`);
  }
}

// Verifica specifica per Supabase
const supabasePath = path.join(nodeModulesPath, '@supabase', 'supabase-js');
if (fs.existsSync(supabasePath)) {
  const supabasePackageJson = JSON.parse(
    fs.readFileSync(path.join(supabasePath, 'package.json'), 'utf8')
  );
  console.log(`   Versione installata: ${supabasePackageJson.version}`);
}

console.log('\n');

if (allOk) {
  console.log('✅ Tutte le dipendenze sono installate correttamente!');
  process.exit(0);
} else {
  console.log('❌ Alcune dipendenze mancano o non sono installate correttamente.');
  console.log('\n💡 Soluzione:');
  console.log('   1. Elimina node_modules e package-lock.json');
  console.log('   2. Esegui: npm install');
  process.exit(1);
}
