-- Migration 014: Add missing columns found by edge function audit
-- Date: 2026-04-10
-- Audit: 78 column mismatches across 16 edge functions
-- Root cause: edge functions query columns that were never created in production

-- VIAJES: 10 missing columns (analisis-8020, comisiones-ejecutivo, estadisticas-cumplimiento,
-- presupuesto-mensual, rankings-automaticos, rentabilidad-tracto, radiografia-financiera)
ALTER TABLE viajes ADD COLUMN IF NOT EXISTS ingreso_estimado NUMERIC(14,2) DEFAULT 0;
ALTER TABLE viajes ADD COLUMN IF NOT EXISTS costo_estimado NUMERIC(14,2) DEFAULT 0;
ALTER TABLE viajes ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE viajes ADD COLUMN IF NOT EXISTS ejecutivo_id UUID;
ALTER TABLE viajes ADD COLUMN IF NOT EXISTS ejecutivo_email TEXT;
ALTER TABLE viajes ADD COLUMN IF NOT EXISTS fecha_llegada_estimada TIMESTAMPTZ;
ALTER TABLE viajes ADD COLUMN IF NOT EXISTS fecha_llegada_real TIMESTAMPTZ;
ALTER TABLE viajes ADD COLUMN IF NOT EXISTS ruta_origen TEXT;
ALTER TABLE viajes ADD COLUMN IF NOT EXISTS ruta_destino TEXT;
ALTER TABLE viajes ADD COLUMN IF NOT EXISTS km_estimados NUMERIC(10,2) DEFAULT 0;

-- TRACTOS: marca, modelo (analisis-8020)
ALTER TABLE tractos ADD COLUMN IF NOT EXISTS marca TEXT;
ALTER TABLE tractos ADD COLUMN IF NOT EXISTS modelo TEXT;

-- LEADS: ejecutivo_email (anti-acaparamiento, disciplina-cierre)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ejecutivo_email TEXT;

-- USUARIOS_AUTORIZADOS: id, nombre (multiple edge functions)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'usuarios_autorizados' AND column_name = 'id'
  ) THEN
    ALTER TABLE usuarios_autorizados ADD COLUMN id UUID DEFAULT gen_random_uuid();
  END IF;
END $$;
ALTER TABLE usuarios_autorizados ADD COLUMN IF NOT EXISTS nombre TEXT;

-- CLIENTES: contact columns (felicitaciones-cumpleanos, estadisticas, whatsapp)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS contacto_email TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS contacto_telefono TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS ejecutivo_email TEXT;

-- PRESUPUESTOS_CLIENTES: presupuesto alias
ALTER TABLE presupuestos_clientes ADD COLUMN IF NOT EXISTS presupuesto NUMERIC(14,2) DEFAULT 0;
