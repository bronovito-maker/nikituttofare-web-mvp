-- Create trusted_partners table
CREATE TABLE public.trusted_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    city TEXT NOT NULL,
    phone TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    internal_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.trusted_partners ENABLE ROW LEVEL SECURITY;

-- Admins and technicians can read partners
CREATE POLICY "Technicians and admins can view partners"
    ON public.trusted_partners
    FOR SELECT
    USING (
        (auth.jwt() ->> 'role' = 'technician') OR 
        (auth.jwt() ->> 'role' = 'admin') OR
        (auth.jwt() ->> 'email' = 'bronovito@gmail.com')
    );

-- Admins and technicians can insert/update partners
CREATE POLICY "Technicians and admins can manage partners"
    ON public.trusted_partners
    FOR ALL
    USING (
        (auth.jwt() ->> 'role' = 'technician') OR 
        (auth.jwt() ->> 'role' = 'admin') OR
        (auth.jwt() ->> 'email' = 'bronovito@gmail.com')
    );



-- Insert some mock data for Riccione/Rimini
INSERT INTO public.trusted_partners (name, category, city, phone, rating, internal_notes) VALUES
('Mario Idraulica', 'caldaista', 'Riccione', '+393331234567', 5, 'Bravissimo con le caldaie Vaillant. Lavora anche di sabato mattina.'),
('ElettroRimini di Rossi', 'elettricista', 'Rimini', '+393471234567', 4, 'Veloce per emergenze elettriche, non fa impianti nuovi.'),
('Pronto Intervento Fabbro', 'fabbro', 'Riccione', '+393381234567', 5, 'Apre porte blindate in 20 minuti senza scasso. Costoso ma efficace.');
