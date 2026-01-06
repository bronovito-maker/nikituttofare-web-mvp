# 🔧 Troubleshooting - Errori Comuni

## Errore EPERM (Permission Denied)

Se vedi errori come:
```
Error: EPERM: operation not permitted, open '/path/to/node_modules/...'
```

### Soluzione 1: Reinstallare node_modules
```bash
# Elimina node_modules e package-lock.json
rm -rf node_modules package-lock.json

# Reinstalla le dipendenze
npm install
```

### Soluzione 2: Verificare permessi
```bash
# Verifica i permessi della directory
ls -la node_modules

# Se necessario, correggi i permessi
chmod -R 755 node_modules
```

### Soluzione 3: Usare npm con permessi corretti
```bash
# Su macOS/Linux, assicurati di non usare sudo
# Se hai usato sudo in precedenza, potrebbe aver creato problemi di permessi
```

## Warning: Multiple Lockfiles

Se vedi:
```
⚠ Warning: Next.js inferred your workspace root, but it may not be correct.
We detected multiple lockfiles...
```

### Soluzione
C'è un `package-lock.json` nella directory parent. Puoi:
1. Eliminare il lockfile nella directory parent (se non serve)
2. Aggiungere `outputFileTracingRoot` in `next.config.mjs`:

```javascript
const nextConfig = {
  outputFileTracingRoot: require('path').join(__dirname, '../../'),
};
```

## Errori di Compilazione TypeScript

### Verifica che i file siano inclusi in tsconfig.json
I file in `lib/` dovrebbero essere automaticamente inclusi, ma verifica che `tsconfig.json` contenga:
```json
{
  "include": [
    "**/*.ts",
    "**/*.tsx",
    "next-env.d.ts",
    "types/**/*.d.ts"
  ]
}
```

### Verifica che le dipendenze siano installate
```bash
# Verifica che @supabase/supabase-js sia installato
npm list @supabase/supabase-js

# Se non è installato, installalo
npm install @supabase/supabase-js
```

## Errori "Missing Supabase environment variables"

Se vedi questo errore a runtime:
```
Missing Supabase environment variables. Please check your .env file.
```

### Soluzione
1. Crea un file `.env` nella root del progetto
2. Copia le variabili da `env.example`
3. Compila con le tue chiavi Supabase
4. Riavvia il server di sviluppo

## Errori di Import

Se vedi errori come:
```
Cannot find module '@/lib/supabase'
```

### Soluzione
Verifica che `tsconfig.json` abbia il path mapping corretto:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["*"]
    }
  }
}
```

## Verifica Rapida

Esegui questi comandi per verificare che tutto sia a posto:

```bash
# 1. Verifica che le dipendenze siano installate
npm list @supabase/supabase-js

# 2. Verifica che i file esistano
ls -la lib/supabase.ts
ls -la lib/database.types.ts

# 3. Verifica che .env esista (opzionale, solo se hai già configurato Supabase)
ls -la .env

# 4. Prova a compilare
npm run build
```
