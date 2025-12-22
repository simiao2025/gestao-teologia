-- Execute este comando no Editor SQL do seu Dashboard do Supabase:

ALTER TABLE config_sistema ADD COLUMN IF NOT EXISTS tema text DEFAULT 'light';

-- Garante que o registro existente tenha o tema padrão
UPDATE config_sistema SET tema = 'light' WHERE tema IS NULL;
