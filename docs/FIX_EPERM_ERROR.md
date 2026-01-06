# 🔧 Risoluzione Errore EPERM

## Problema
Quando avvii il server con `npm run dev`, vedi errori come:
```
Error: EPERM: operation not permitted, open '/path/to/node_modules/...'
```

## Cause Possibili
1. **Permessi corrotti** su `node_modules`
2. **Installazione incompleta** delle dipendenze
3. **Uso di sudo** durante l'installazione (crea problemi di permessi)
4. **Directory duplicata** che causa confusione

## Soluzione Rapida

### Step 1: Verifica le dipendenze
```bash
npm run check-deps
```

Questo script verifica che tutte le dipendenze necessarie siano installate.

### Step 2: Reinstalla node_modules
```bash
# Elimina node_modules e package-lock.json
rm -rf node_modules package-lock.json

# Reinstalla tutto
npm install
```

### Step 3: Verifica i permessi (macOS/Linux)
```bash
# Verifica i permessi della directory
ls -la node_modules | head -5

# Se vedi permessi strani, correggili
chmod -R 755 node_modules
```

### Step 4: Riavvia il server
```bash
npm run dev
```

## Se il Problema Persiste

### Opzione A: Usa npm cache clean
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Opzione B: Verifica la struttura delle directory
Se vedi una directory `nikituttofare-web-mvp` dentro un'altra `nikituttofare-web-mvp`, assicurati di essere nella directory corretta:
```bash
# Dovresti essere qui:
cd /Users/bronovito/Desktop/NIKI\ TUTTOFARE/NTF\ 2k26/nikituttofare-web-mvp/nikituttofare-web-mvp

# Verifica che ci sia package.json
ls package.json
```

### Opzione C: Usa npx invece di npm globale
Se hai problemi con npm globale, prova:
```bash
npx next dev
```

## Verifica Finale

Dopo aver seguito i passaggi, verifica che tutto funzioni:

```bash
# 1. Verifica dipendenze
npm run check-deps

# 2. Prova a compilare
npm run build

# 3. Avvia il server
npm run dev
```

## Note Importanti

- **NON usare sudo** con npm (crea problemi di permessi)
- Se hai usato sudo in precedenza, potresti dover correggere i permessi manualmente
- Assicurati di essere nella directory corretta del progetto

## Dipendenze Richieste

Le seguenti dipendenze devono essere installate:
- ✅ `@supabase/supabase-js` (già in package.json)
- ✅ `next`
- ✅ `react`
- ✅ `react-dom`

Se manca qualcosa, lo script `npm run check-deps` te lo dirà.
