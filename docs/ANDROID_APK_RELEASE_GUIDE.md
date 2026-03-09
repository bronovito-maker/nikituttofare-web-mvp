# Android APK Release Guide (Pixel 8 Pro)

## 1) Cos'e' il Keystore (in semplice)
Il keystore e' il file che "firma" la tua app Android.
- Senza keystore: puoi fare solo build debug.
- Con keystore: generi APK release stabile e aggiornabile nel tempo.

Importante:
- Se perdi keystore o password, non puoi mantenere la stessa firma per gli update.
- Salva keystore e credenziali in un vault sicuro + backup offline.

## 2) Prerequisiti
- Android Studio installato (gratuito)
- JDK compatibile
- Progetto con Capacitor Android configurato
- Keystore release creato

## 3) Flusso Standard Build APK
1. Build web:
```bash
npm run build
```
2. Sync Capacitor:
```bash
npx cap sync android
```
3. Apri progetto Android:
```bash
npx cap open android
```
4. In Android Studio:
- `Build` -> `Generate Signed Bundle / APK`
- scegli `APK`
- seleziona keystore + alias + password
- build `release`

5. Installa su Pixel 8 Pro e testa:
- login tecnico
- creazione lavoro manuale
- AI testo/voce/immagine
- notifiche
- offline sync

## 4) Dove mettere il Keystore
Consiglio:
- non committare mai il keystore in Git
- conservarlo fuori dal repository (cartella sicura locale o secret manager)

## 5) Checklist di Qualita' Pre-Release
- `npm run lint`
- `npm test`
- `npm run test:ai` (regressione customer flow)
- test manuale completo su Pixel 8 Pro
- verifica crash-free nelle azioni principali

## 6) Consigli Pratici
- Inizia con APK interno (sideload) per validazione campo.
- Solo dopo stabilita' passa a pipeline CI/CD Android.
- Mantieni changelog release con data, versione e fix principali.

