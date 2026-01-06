// scripts/generate-secret.js
// Genera un secret sicuro per NextAuth

const crypto = require('crypto');

const secret = crypto.randomBytes(32).toString('base64');

console.log('\n🔐 NextAuth Secret generato:\n');
console.log(secret);
console.log('\n📝 Aggiungi questa riga al tuo file .env:\n');
console.log(`NEXTAUTH_SECRET=${secret}\n`);
console.log('⚠️  IMPORTANTE: Non condividere mai questo secret!\n');
