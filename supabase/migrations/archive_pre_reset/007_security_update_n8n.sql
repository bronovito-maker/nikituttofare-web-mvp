-- Abilita RLS su n8n_chat_histories
ALTER TABLE n8n_chat_histories ENABLE ROW LEVEL SECURITY;

-- Policy per consentire la SELECT solo agli admin/superadmin
CREATE POLICY "Allow SELECT for admins" ON n8n_chat_histories
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
  )
);

-- Imposta security_invoker = true sulla vista orphan_sessions_view
ALTER VIEW orphan_sessions_view SET (security_invoker = true);

-- Revoca permessi al ruolo anon (buona pratica)
REVOKE ALL ON n8n_chat_histories FROM anon;
REVOKE ALL ON orphan_sessions_view FROM anon;
