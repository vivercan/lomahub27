-- 021_fix_catalogos_alta.sql
-- Corrige catalogo_cxc y catalogo_csr con datos reales validados por JJ (13/Abr/2026)
-- Reemplaza el seed incorrecto de migration 020 (nombres/emails inventados)

CREATE TABLE IF NOT EXISTS public.catalogo_csr (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre             TEXT NOT NULL,
  email              TEXT NOT NULL UNIQUE,
  telefono           TEXT,
  clientes_asignados INTEGER DEFAULT 0,
  activo             BOOLEAN DEFAULT true,
  created_at         TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.catalogo_cxc (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre             TEXT NOT NULL,
  email              TEXT NOT NULL UNIQUE,
  telefono           TEXT,
  empresa            TEXT,
  clientes_asignados INTEGER DEFAULT 0,
  activo             BOOLEAN DEFAULT true,
  created_at         TIMESTAMPTZ DEFAULT now()
);

DELETE FROM public.catalogo_cxc WHERE email IN (
  'claudia.verde@trob.com.mx','norma@trob.com.mx','fernando.zapata@trob.com.mx',
  'diana@trob.com.mx','karla@trob.com.mx','eduardo@trob.com.mx','miguel@trob.com.mx'
);

INSERT INTO public.catalogo_cxc (nombre, email, telefono, empresa, activo) VALUES
  ('Fernanda Flores', 'maria.flores@trob.com.mx',        '449 592 0718', 'TROB',       true),
  ('Miguel Padilla',  'miguel.padilla@wexpress.com.mx',  '449 521 3117', 'WExpress',   true),
  ('Karla Munoz',     'karla.munoz@speedyhaul.com.mx',   '449 546 1703', 'SpeedyHaul', true),
  ('Diana Ortiz',     'diana.ortiz@trob.com.mx',         '449 592 0547', 'TROB',       true),
  ('Eduardo Noriega', 'eduardo.noriega@trob.com.mx',     '449 592 0667', 'TROB',       true),
  ('Norma Muniz',     'norma.muniz@trob.com.mx',         '449 592 0749', 'TROB',       true),
  ('Fernanda Zapata', 'fernanda.zapata@wexpress.com.mx', '449 125 0291', 'WExpress',   true)
ON CONFLICT (email) DO UPDATE SET
  nombre=EXCLUDED.nombre, telefono=EXCLUDED.telefono, empresa=EXCLUDED.empresa, activo=EXCLUDED.activo;

INSERT INTO public.catalogo_csr (nombre, email, telefono, activo) VALUES
  ('Elizabeth Pasillas Romo', 'customer.service1@trob.com.mx', '+52 449 189 6642', true),
  ('Lizeth Garcia Paredes',   'customer.service3@trob.com.mx', '+52 449 236 4738', true)
ON CONFLICT (email) DO UPDATE SET
  nombre=EXCLUDED.nombre, telefono=EXCLUDED.telefono, activo=EXCLUDED.activo;

ALTER TABLE public.catalogo_csr ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogo_cxc ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='catalogo_csr_read_all' AND tablename='catalogo_csr') THEN
    CREATE POLICY catalogo_csr_read_all ON public.catalogo_csr FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='catalogo_cxc_read_all' AND tablename='catalogo_cxc') THEN
    CREATE POLICY catalogo_cxc_read_all ON public.catalogo_cxc FOR SELECT USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_catalogo_csr_activo  ON public.catalogo_csr(activo);
CREATE INDEX IF NOT EXISTS idx_catalogo_cxc_activo  ON public.catalogo_cxc(activo);
CREATE INDEX IF NOT EXISTS idx_catalogo_cxc_empresa ON public.catalogo_cxc(empresa);
