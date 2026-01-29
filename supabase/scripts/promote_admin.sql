-- ============================================
-- SCRIPT: Promuovi Utente ad Admin
-- ============================================
-- Esegui questo script nel SQL Editor di Supabase
-- dopo che l'utente si è registrato con Magic Link

-- OPZIONE 1: Promuovi per email
-- Sostituisci 'admin@esempio.com' con l'email reale
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@esempio.com';

-- OPZIONE 2: Promuovi per ID utente
-- (Sostituisci UUID e decommenta se necessario)
-- UPDATE public.profiles SET role = 'admin' WHERE id = 'uuid-here';

-- ============================================
-- VERIFICA
-- ============================================
-- Mostra tutti gli admin
SELECT id, email, full_name, role, created_at
FROM public.profiles
WHERE role = 'admin';

-- ============================================
-- RIMUOVI RUOLO ADMIN
-- ============================================
-- (Esegui update manuale se necessario)
