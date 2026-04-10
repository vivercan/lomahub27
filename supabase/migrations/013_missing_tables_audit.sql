-- Migration 013: Create 8 missing tables found by schema audit
-- Date: 2026-04-10
-- Audit: 39 tables referenced by src/pages/ components, 31 existed, 8 were missing
-- Tables created: correos_automaticos, dedicados_programacion, documentos_onboarding,
--   formato_viaje, gps_unidades, integraciones, parametros_tarifas, viajes_impex

-- 1. correos_automaticos (comunicaciones/CorreosAutomaticos.tsx)
CREATE TABLE IF NOT EXISTS correos_automaticos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  asunto TEXT NOT NULL,
  trigger_evento TEXT NOT NULL CHECK (trigger_evento IN ('nuevo_lead','cotizacion_enviada','seguimiento_3d','seguimiento_7d','bienvenida','vencimiento','cobranza','manual')),
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('activo','pausado','borrador')),
  destinatarios INT DEFAULT 0,
  enviados INT DEFAULT 0,
  tasa_apertura NUMERIC(5,2) DEFAULT 0,
  ultima_ejecucion TIMESTAMPTZ,
  creado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 2. dedicados_programacion (operaciones/ProgramacionDedicados.tsx)
CREATE TABLE IF NOT EXISTS dedicados_programacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracto TEXT NOT NULL,
  operador TEXT NOT NULL,
  cliente TEXT NOT NULL,
  ruta TEXT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('activa','pendiente','completada','cancelada')),
  turno TEXT NOT NULL DEFAULT 'completo' CHECK (turno IN ('matutino','vespertino','nocturno','completo')),
  viajes_semana INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 3. documentos_onboarding (clientes/PortalDocumentos.tsx)
CREATE TABLE IF NOT EXISTS documentos_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL,
  tipo_documento TEXT NOT NULL,
  nombre_archivo TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente','subido','aprobado','rechazado')),
  razon_rechazo TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 4. formato_viaje (operaciones/Despachos.tsx)
CREATE TABLE IF NOT EXISTS formato_viaje (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL,
  fecha_vigencia DATE,
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo','inactivo','vencido')),
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 5. gps_unidades (admin/ConfigIntegraciones.tsx)
CREATE TABLE IF NOT EXISTS gps_unidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidad TEXT NOT NULL,
  imei TEXT,
  proveedor TEXT DEFAULT 'WideTech',
  tipo TEXT DEFAULT 'tracto',
  activa BOOLEAN DEFAULT true,
  ultima_posicion JSONB,
  ultima_actualizacion TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 6. integraciones (admin/PanelIntegraciones.tsx)
CREATE TABLE IF NOT EXISTS integraciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('gps','whatsapp','facturacion','erp','email','anodos','maps','supabase')),
  estado TEXT NOT NULL DEFAULT 'desconectado' CHECK (estado IN ('conectado','desconectado','error','configurando')),
  ultima_sync TIMESTAMPTZ,
  registros_sync INT DEFAULT 0,
  api_key_configurada BOOLEAN DEFAULT false,
  url_endpoint TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 7. parametros_tarifas (admin/ParametrosConfig.tsx)
CREATE TABLE IF NOT EXISTS parametros_tarifas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria TEXT NOT NULL,
  concepto TEXT NOT NULL,
  unidad TEXT NOT NULL,
  valor NUMERIC(12,2) NOT NULL DEFAULT 0,
  moneda TEXT NOT NULL DEFAULT 'MXN',
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 8. viajes_impex (operaciones/ProgramacionIMPEX.tsx)
CREATE TABLE IF NOT EXISTS viajes_impex (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL,
  origen TEXT NOT NULL,
  destino TEXT NOT NULL,
  cliente TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('importacion','exportacion')),
  estado TEXT NOT NULL DEFAULT 'programado' CHECK (estado IN ('programado','en_transito','completado','cancelado')),
  tracto TEXT,
  operador TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Enable RLS on all new tables
ALTER TABLE correos_automaticos ENABLE ROW LEVEL SECURITY;
ALTER TABLE dedicados_programacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE formato_viaje ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE integraciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE parametros_tarifas ENABLE ROW LEVEL SECURITY;
ALTER TABLE viajes_impex ENABLE ROW LEVEL SECURITY;

-- RLS: authenticated read
CREATE POLICY "authenticated_read" ON correos_automaticos FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON dedicados_programacion FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON documentos_onboarding FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON formato_viaje FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON gps_unidades FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON integraciones FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON parametros_tarifas FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON viajes_impex FOR SELECT TO authenticated USING (true);

-- RLS: authenticated write (insert/update/delete)
CREATE POLICY "authenticated_write" ON correos_automaticos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_write" ON dedicados_programacion FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_write" ON documentos_onboarding FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_write" ON formato_viaje FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_write" ON gps_unidades FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_write" ON integraciones FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_write" ON parametros_tarifas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_write" ON viajes_impex FOR ALL TO authenticated USING (true) WITH CHECK (true);
