-- Create leads table
create table if not exists public.leads (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    city text,
    type text, -- 'Hotel', 'Ristorante', 'Bar', etc.
    rating int default 0,
    address text,
    phone text,
    email text,
    status_mail_sent boolean default false,
    status_called boolean default false,
    status_visited boolean default false,
    status_confirmed boolean default false,
    notes text,
    coordinates point, -- Uses Postgres geometric type
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Enable RLS
alter table public.leads enable row level security;

-- Policies
create policy "Admin access only"
    on public.leads
    for all
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
    );

-- Create index for faster filtering
create index if not exists leads_city_idx on public.leads(city);
create index if not exists leads_status_confirmed_idx on public.leads(status_confirmed);
