-- ==========================================
-- SPRINT 3: SISTEMA INVENTARIO MVP
-- Esegui questo script in Supabase SQL Editor
-- focus: Creazione tabelle inventario, movimenti e utilizzo cantiere
-- ==========================================

-- 1. Tabella Articoli di Inventario (Catalogo)
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id text NOT NULL, -- Per isolamento multi-tenant
    name text NOT NULL,
    sku text,
    category text,
    description text,
    quantity_at_hand integer DEFAULT 0 NOT NULL,
    minimum_quantity_alert integer DEFAULT 0,
    unit_of_measure text DEFAULT 'pz', -- es: pz, m, kg
    unit_cost numeric(10, 2),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Indici per performance e isolamento
CREATE INDEX IF NOT EXISTS idx_inventory_items_tenant ON public.inventory_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON public.inventory_items(category);

-- 2. Tabella Movimenti di Magazzino (Storico Carico/Scarico)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id text NOT NULL,
    inventory_item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    technician_id uuid REFERENCES public.profiles(id), -- Chi ha mosso la merce
    movement_type text NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'job_usage')),
    quantity integer NOT NULL, -- Positivo per entrate, negativo per uscite
    notes text,
    job_id uuid REFERENCES public.tickets(id) ON DELETE SET NULL, -- Se collegato a un ticket
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_item ON public.inventory_movements(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_tenant ON public.inventory_movements(tenant_id);

-- 3. Tabella Utilizzo Inventario nei Lavori (Relazione Lavori <-> Inventario)
CREATE TABLE IF NOT EXISTS public.job_inventory_usage (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id text NOT NULL,
    job_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    inventory_item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
    quantity_used integer NOT NULL CHECK (quantity_used > 0),
    technician_id uuid REFERENCES public.profiles(id), -- Chi ha registrato l'uso
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS unq_job_inventory ON public.job_inventory_usage(job_id, inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_job_inventory_tenant ON public.job_inventory_usage(tenant_id);

-- 4. Funzione Trigger per aggiornare automatically quantity_at_hand all'uso nei cantieri
CREATE OR REPLACE FUNCTION update_inventory_quantity_on_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- Se stiamo inserendo un nuovo utilizzo, deduciamo dall'inventario
    IF TG_OP = 'INSERT' THEN
        UPDATE public.inventory_items
        SET quantity_at_hand = quantity_at_hand - NEW.quantity_used
        WHERE id = NEW.inventory_item_id;
        
        -- Inseriamo anche il record nello storico movimenti
        INSERT INTO public.inventory_movements (tenant_id, inventory_item_id, technician_id, movement_type, quantity, job_id, notes)
        VALUES (NEW.tenant_id, NEW.inventory_item_id, NEW.technician_id, 'job_usage', -NEW.quantity_used, NEW.job_id, 'Scarico automatico per cantiere');
        
    -- Se stiamo eliminando un utilizzo, ripristiniamo l'inventario (es. errore del tecnico)
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.inventory_items
        SET quantity_at_hand = quantity_at_hand + OLD.quantity_used
        WHERE id = OLD.inventory_item_id;
        
        -- Inseriamo un movimento di aggiustamento
        INSERT INTO public.inventory_movements (tenant_id, inventory_item_id, technician_id, movement_type, quantity, job_id, notes)
        VALUES (OLD.tenant_id, OLD.inventory_item_id, OLD.technician_id, 'adjustment', OLD.quantity_used, OLD.job_id, 'Storno automatico da cantiere');
    
    -- Se stiamo aggiornando le quantità usate
    ELSIF TG_OP = 'UPDATE' THEN
        -- Differenza = nuova_qta - vecchia_qta. Se positiva, stiamo sprecando più materiale, quindi -differenza nell'inventario.
        UPDATE public.inventory_items
        SET quantity_at_hand = quantity_at_hand - (NEW.quantity_used - OLD.quantity_used)
        WHERE id = NEW.inventory_item_id;
        
        -- Registriamo il delta nei movimenti
        INSERT INTO public.inventory_movements (tenant_id, inventory_item_id, technician_id, movement_type, quantity, job_id, notes)
        VALUES (NEW.tenant_id, NEW.inventory_item_id, NEW.technician_id, 'adjustment', -(NEW.quantity_used - OLD.quantity_used), NEW.job_id, 'Aggiornamento automatico quantità cantiere');
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Colleghiamo il trigger alla tabella job_inventory_usage
DROP TRIGGER IF EXISTS trg_update_inventory_quantity ON public.job_inventory_usage;
CREATE TRIGGER trg_update_inventory_quantity
AFTER INSERT OR UPDATE OR DELETE ON public.job_inventory_usage
FOR EACH ROW EXECUTE FUNCTION update_inventory_quantity_on_usage();

-- 5. Sicurezza (RLS)
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_inventory_usage ENABLE ROW LEVEL SECURITY;

-- Policy di base multi-tenant: gli admin/tecnici vedono/modificano solo la roba del proprio tenant
-- Nota: Qui assumiamo che il client (Browser) debba solo poter LEGGERE gli item. 
-- Le modifiche (scritture) avverranno rigorosamente in Server Actions usando service_role che bypassa RLS.

CREATE POLICY "Users can view inventory of their tenant" ON public.inventory_items
    FOR SELECT USING (tenant_id = (SELECT raw_user_meta_data->>'tenant_id' FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can view usages of their tenant" ON public.job_inventory_usage
    FOR SELECT USING (tenant_id = (SELECT raw_user_meta_data->>'tenant_id' FROM auth.users WHERE id = auth.uid()));
