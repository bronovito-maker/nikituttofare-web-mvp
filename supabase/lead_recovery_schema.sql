-- Enum for Lead Status
create type recovery_status as enum ('new', 'contacted', 'recovered', 'discarded');

-- Table: leads_recovery
create table if not exists leads_recovery (
  id uuid default gen_random_uuid() primary key,
  chat_session_id text not null, -- Logical FK to messages, but loosely coupled
  detected_intent text,
  extracted_contact jsonb default '{}'::jsonb,
  lead_score integer check (lead_score >= 1 and lead_score <= 10),
  status recovery_status default 'new',
  abandoned_at timestamp with time zone not null,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Index for performance
create index if not exists idx_leads_recovery_session on leads_recovery(chat_session_id);
create index if not exists idx_leads_recovery_status on leads_recovery(status);

-- View: orphan_sessions_view
-- Identifies sessions in 'messages' table that:
-- 1. Have messages older than 2 hours (inactive)
-- 2. Do NOT have a comprehensive ticket associated (ticket_id is NULL in messages)
-- 3. Are NOT already in leads_recovery
create or replace view orphan_sessions_view as
select 
  distinct m.chat_session_id,
  max(m.created_at) as last_message_at
from messages m
where m.created_at < (now() - interval '2 hours')
  and m.ticket_id is null
group by m.chat_session_id
having not exists (
  select 1 
  from leads_recovery lr 
  where lr.chat_session_id = m.chat_session_id
);

-- RLS Policies (Admin only access for now)
alter table leads_recovery enable row level security;

create policy "Admins can do everything on leads_recovery"
  on leads_recovery
  for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );
