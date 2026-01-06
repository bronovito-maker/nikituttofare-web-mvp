# 🏗️ NikiTuttoFare (NTF) - Masterplan & Roadmap

## 🎯 Obiettivo
Piattaforma Enterprise per emergenze HORECA/Domestiche.
Filosofia: "Zero Cognitive Load" per l'utente, "Automazione" per l'admin.

## 🗺️ FASI DI SVILUPPO

### 🟢 FASE 1: Fondamenta (Database & Auth)
1. **Schema DB:** Creare tabelle `users`, `tickets`, `messages` su Supabase.
2. **Auth:** Configurare Supabase Magic Link (Email).
3. **Storage:** Bucket per foto guasti con policy RLS.

### 🟡 FASE 2: Business Core (AI Chat)
4. **Chat Logic:** Salvare chat su DB. Gemini classifica il problema (Idraulico, Elettrico).
5. **Form Invisibile:** L'AI estrae i dati e crea il Ticket automaticamente.

### 🔵 FASE 3: Notifiche (Telegram Bot)
6. **Telegram Dispatcher:** Quando si crea un Ticket -> Notifica immediata su Gruppo Telegram Admin con Foto.

### 🟣 FASE 4: Admin Dashboard
7. **Pannello Admin:** Tabella ticket, cambio stato, assegnazione tecnici.

### 🟠 FASE 5: Pagamenti (Predisposizione)
8. **Schema:** Aggiungere colonne `payment_status`, `amount` al DB (per Stripe futuro).