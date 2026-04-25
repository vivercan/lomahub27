-- ──────────────────────────────────────────────────────────────────────────
-- 030_terminales_inventario_objetivo_25Abr2026.sql
-- 1) DELETE Best Trailers Querétaro (terminal eliminada por JJ)
-- 2) Renombrar terminales: quitar prefijo "TROB " excepto USA
-- 3) Crear tabla terminal_inventario_objetivo + RLS + seed default 2/2
-- ──────────────────────────────────────────────────────────────────────────
-- NOTA: este SQL ya fue ejecutado vía browser automation en Supabase SQL Editor
-- el 25/Abr/2026 02:30 hrs. Este archivo es para trazabilidad/replicabilidad.
-- Es 100% idempotente (IF NOT EXISTS, ON CONFLICT DO NOTHING).
-- ──────────────────────────────────────────────────────────────────────────

BEGIN;

-- 1) Borrar Best Trailers
DELETE FROM public.terminales WHERE nombre ILIKE '%best%trailers%';

-- 2) Renombrar terminales (TROB Aguascalientes → Aguascalientes, etc.)
UPDATE public.terminales SET nombre = 'Aguascalientes'
  WHERE nombre ILIKE '%aguascalientes%' AND nombre NOT ILIKE '%TX%';

UPDATE public.terminales SET nombre = 'Monterrey'
  WHERE nombre ILIKE 'TROB Monterrey%' OR nombre ILIKE '%Patio TROB%';

UPDATE public.terminales SET nombre = 'Nuevo Laredo'
  WHERE (nombre ILIKE '%nvo laredo%' OR nombre ILIKE '%nuevo laredo%')
    AND nombre NOT ILIKE '%TX%';

UPDATE public.terminales SET nombre = 'Querétaro'
  WHERE (nombre ILIKE 'TROB Queretaro%' OR nombre ILIKE 'TROB Querétaro%' OR nombre ILIKE 'Patio Querétaro%')
    AND nombre NOT ILIKE '%best%';

UPDATE public.terminales SET nombre = 'TROB Laredo TX'
  WHERE nombre ILIKE '%Laredo TX%' OR nombre ILIKE '%laredo, tx%' OR nombre = 'TROB USA';

-- Fix tilde Querétaro (en caso de haber quedado sin tilde)
UPDATE public.terminales SET nombre = 'Querétaro' WHERE nombre = 'Queretaro';

-- 3) CREATE TABLE terminal_inventario_objetivo
CREATE TABLE IF NOT EXISTS public.terminal_inventario_objetivo (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  terminal_id  uuid NOT NULL REFERENCES public.terminales(id) ON DELETE CASCADE,
  tipo_caja    text NOT NULL CHECK (tipo_caja IN ('seca', 'thermo')),
  cantidad_objetivo int NOT NULL DEFAULT 2 CHECK (cantidad_objetivo >= 0),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (terminal_id, tipo_caja)
);

CREATE OR REPLACE FUNCTION public.set_updated_at_terminal_inv() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_updated_at_terminal_inv ON public.terminal_inventario_objetivo;
CREATE TRIGGER trg_set_updated_at_terminal_inv
  BEFORE UPDATE ON public.terminal_inventario_objetivo
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_terminal_inv();

-- 4) RLS
ALTER TABLE public.terminal_inventario_objetivo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_authenticated" ON public.terminal_inventario_objetivo;
CREATE POLICY "select_authenticated" ON public.terminal_inventario_objetivo
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "modify_authenticated" ON public.terminal_inventario_objetivo;
CREATE POLICY "modify_authenticated" ON public.terminal_inventario_objetivo
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5) Seed default 2 secas + 2 thermos por terminal activa
INSERT INTO public.terminal_inventario_objetivo (terminal_id, tipo_caja, cantidad_objetivo)
SELECT id, 'seca', 2 FROM public.terminales WHERE activa = true
ON CONFLICT (terminal_id, tipo_caja) DO NOTHING;

INSERT INTO public.terminal_inventario_objetivo (terminal_id, tipo_caja, cantidad_objetivo)
SELECT id, 'thermo', 2 FROM public.terminales WHERE activa = true
ON CONFLICT (terminal_id, tipo_caja) DO NOTHING;

COMMIT;
