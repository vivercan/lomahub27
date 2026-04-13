-- Migration 020 — Redirect alta_clientes CSR/CxC FKs to catalog tables
-- Context: csr_asignada and cxc_asignado were pointing to auth.users, but the product
-- design requires them to reference the admin-managed catalog tables catalogo_csr and
-- catalogo_cxc so Configuración can own the list of available ejecutivos without needing
-- them to be registered auth.users.
--
-- Effect: Drops the old FK constraints and recreates them pointing to the catalog tables
-- with ON DELETE SET NULL so removing a catalog entry doesn't break historical altas.

BEGIN;

ALTER TABLE public.alta_clientes
  DROP CONSTRAINT IF EXISTS alta_clientes_csr_asignada_fkey,
  DROP CONSTRAINT IF EXISTS alta_clientes_cxc_asignado_fkey;

ALTER TABLE public.alta_clientes
  ADD CONSTRAINT alta_clientes_csr_asignada_fkey
    FOREIGN KEY (csr_asignada) REFERENCES public.catalogo_csr(id) ON DELETE SET NULL,
  ADD CONSTRAINT alta_clientes_cxc_asignado_fkey
    FOREIGN KEY (cxc_asignado) REFERENCES public.catalogo_cxc(id) ON DELETE SET NULL;

-- Seed initial CxC ejecutivos extracted from sc_cobranza historical agente data.
-- Emails use the TROB domain pattern and should be validated by admin in Configuración.
INSERT INTO public.catalogo_cxc (nombre, email, telefono, empresa, clientes_asignados, activo) VALUES
  ('Claudia Verde',     'claudia.verde@trob.com.mx',     NULL, 'TROB',  7, true),
  ('Norma',             'norma@trob.com.mx',             NULL, 'TROB', 11, true),
  ('Fernando Zapata',   'fernando.zapata@trob.com.mx',   NULL, 'TROB', 10, true),
  ('Diana',             'diana@trob.com.mx',             NULL, 'TROB',  5, true),
  ('Karla',             'karla@trob.com.mx',             NULL, 'SHI',   4, true),
  ('Eduardo',           'eduardo@trob.com.mx',           NULL, 'TROB',  1, true),
  ('Miguel',            'miguel@trob.com.mx',            NULL, 'TROB',  2, true)
ON CONFLICT DO NOTHING;

COMMIT;
