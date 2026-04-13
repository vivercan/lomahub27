-- 019_alta_clientes_workflow.sql
-- Complete F01 Alta de Clientes workflow columns
-- Supports MX vs USA, multi-company, public portals, full form data

-- Contact + vendedor info
ALTER TABLE alta_clientes ADD COLUMN IF NOT EXISTS contacto_nombre TEXT;
ALTER TABLE alta_clientes ADD COLUMN IF NOT EXISTS contacto_email TEXT;
ALTER TABLE alta_clientes ADD COLUMN IF NOT EXISTS contacto_telefono TEXT;
ALTER TABLE alta_clientes ADD COLUMN IF NOT EXISTS emails_adicionales TEXT;
ALTER TABLE alta_clientes ADD COLUMN IF NOT EXISTS vendedor_nombre TEXT;
ALTER TABLE alta_clientes ADD COLUMN IF NOT EXISTS vendedor_email TEXT;

-- Empresa destino (TROB_MX, TROB_USA, WEXPRESS, SPEDHAULK)
ALTER TABLE alta_clientes ADD COLUMN IF NOT EXISTS empresa_destino TEXT;

-- Tipo empresa (MEXICANA, USA_CANADA)
ALTER TABLE alta_clientes ADD COLUMN IF NOT EXISTS tipo_empresa TEXT;

-- Admin token for review portal (Claudia Verde, CxC)
ALTER TABLE alta_clientes ADD COLUMN IF NOT EXISTS admin_token TEXT;

-- Firma details
ALTER TABLE alta_clientes ADD COLUMN IF NOT EXISTS firmante_nombre TEXT;

-- CxC credit conditions
ALTER TABLE alta_clientes ADD COLUMN IF NOT EXISTS dias_credito INTEGER;

-- Full form data stored as JSONB (empresa datos, contactos, etc)
ALTER TABLE alta_clientes ADD COLUMN IF NOT EXISTS datos_empresa JSONB DEFAULT '{}'::jsonb;

-- Document URLs stored as JSONB (flexible for MX vs USA docs)
ALTER TABLE alta_clientes ADD COLUMN IF NOT EXISTS documentos_urls JSONB DEFAULT '{}'::jsonb;

-- References stored as JSONB array
ALTER TABLE alta_clientes ADD COLUMN IF NOT EXISTS referencias JSONB DEFAULT '[]'::jsonb;

-- RLS policies for public access
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'alta_clientes_public_token_read') THEN
    CREATE POLICY alta_clientes_public_token_read ON alta_clientes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'alta_clientes_public_token_update') THEN
    CREATE POLICY alta_clientes_public_token_update ON alta_clientes FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'alta_clientes_insert_auth') THEN
    CREATE POLICY alta_clientes_insert_auth ON alta_clientes FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_alta_clientes_token ON alta_clientes(token);
CREATE INDEX IF NOT EXISTS idx_alta_clientes_admin_token ON alta_clientes(admin_token);
CREATE INDEX IF NOT EXISTS idx_alta_clientes_estado ON alta_clientes(estado);
CREATE INDEX IF NOT EXISTS idx_alta_clientes_empresa ON alta_clientes(empresa_destino);
