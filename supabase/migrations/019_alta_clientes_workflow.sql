-- 019_alta_clientes_workflow.sql
-- Adds columns needed for the F01 Alta de Clientes workflow
-- New fields: contacto info, vendedor info, firma details, CxC credit days

-- Add contact info columns
ALTER TABLE alta_clientes ADD COLUMN IF NOT EXISTS contacto_nombre TEXT;
ALTER TABLE alta_clientes ADD COLUMN IF NOT EXISTS contacto_email TEXT;
ALTER TABLE alta_clientes ADD COLUMN IF NOT EXISTS contacto_telefono TEXT;
ALTER TABLE alta_clientes ADD COLUMN IF NOT EXISTS emails_adicionales TEXT;

-- Add vendedor info columns
ALTER TABLE alta_clientes ADD COLUMN IF NOT EXISTS vendedor_nombre TEXT;
ALTER TABLE alta_clientes ADD COLUMN IF NOT EXISTS vendedor_email TEXT;

-- Add firma extra fields
ALTER TABLE alta_clientes ADD COLUMN IF NOT EXISTS firmante_nombre TEXT;

-- Add CxC credit days
ALTER TABLE alta_clientes ADD COLUMN IF NOT EXISTS dias_credito INTEGER;

-- Enable public access for portal (token-based, no auth)
-- RLS policy for anonymous reads/updates via token
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'alta_clientes_public_token_read'
  ) THEN
    CREATE POLICY alta_clientes_public_token_read ON alta_clientes
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'alta_clientes_public_token_update'
  ) THEN
    CREATE POLICY alta_clientes_public_token_update ON alta_clientes
      FOR UPDATE USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'alta_clientes_insert_auth'
  ) THEN
    CREATE POLICY alta_clientes_insert_auth ON alta_clientes
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Index on token for fast lookups
CREATE INDEX IF NOT EXISTS idx_alta_clientes_token ON alta_clientes(token);
CREATE INDEX IF NOT EXISTS idx_alta_clientes_estado ON alta_clientes(estado);

-- Storage bucket for onboarding documents (if not exists)
-- Note: bucket creation must be done via Supabase dashboard or API, not SQL
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documentos_onboarding', 'documentos_onboarding', true) ON CONFLICT DO NOTHING;
