# Database Schema & Rules

## Tables

### `users` (Supabase Auth sync)
- `id`: UUID (PK)
- `email`: String (Unique)
- `phone`: String (Nullable initially)
- `role`: ENUM ('customer', 'technician', 'admin')

### `tickets`
- `id`: UUID (PK)
- `user_id`: UUID (FK -> users.id)
- `status`: ENUM
    - `PENDING_VERIFICATION`: Creato ma email non confermata (NON inviare a Telegram).
    - `CONFIRMED`: Email verificata, inviato ai tecnici.
    - `ASSIGNED`: Un tecnico ha accettato.
    - `COMPLETED`: Lavoro finito.
    - `CANCELLED`: Annullato.
- `category`: ENUM ('plumbing', 'electric', 'locksmith', 'climate', 'handyman')
    - *Nota:* Mappare 'Tuttofare' -> 'handyman'.
- `problem_description`: Text (Input utente grezzo + riassunto AI).
- `address_city`: String (Rimini, Riccione, etc.).
- `address_street`: String.
- `price_range_min`: Int.
- `price_range_max`: Int.
- `created_at`: Timestamptz.

### `technicians`
- `id`: UUID (PK)
- `phone_number`: String (Unique, usato per il "Fast Login").
- `telegram_chat_id`: String (Optional).
- `skills`: Array['plumbing', ...].

## Security Policies (RLS)
- Gli utenti vedono solo i propri ticket.
- I tecnici vedono i ticket solo dopo aver fatto "Claim".
- Le funzioni server-side usano `service_role` per inviare notifiche.
