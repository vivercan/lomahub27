================================================================================
-- LomaHUB27: SUPABASE DATABASE SCHEMA - ALL MIGRATIONS CONSOLIDATED
-- Freight Transport CRM/TMS System
-- Execute in order for proper database setup
================================================================================


================================================================================
-- MIGRATION 001: Extensions and Helper Functions
================================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Helper: obtener rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_rol()
RETURNS TEXT AS $$
  SELECT raw_app_meta_data->>'rol'
  FROM auth.users
  WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper: obtener empresa del usuario actual
CREATE OR REPLACE FUNCTION get_user_empresa()
RETURNS TEXT AS $$
  SELECT raw_app_meta_data->>'empresa'
  FROM auth.users
  WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper: verificar si el usuario es admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT get_user_rol() IN ('superadmin', 'admin')
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper: verificar si es dirección o superior
CREATE OR REPLACE FUNCTION is_direccion()
RETURNS BOOLEAN AS $$
  SELECT get_user_rol() IN ('superadmin', 'admin', 'direccion')
$$ LANGUAGE SQL SECURITY DEFINER STABLE;


================================================================================
-- MIGRATION 002: Catálogos del Sistema (System Catalogs)
================================================================================

CREATE TABLE empresas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE segmentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  empresa_id UUID REFERENCES empresas(id),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE plazas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  estado TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE parametros_sistema (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clave TEXT NOT NULL UNIQUE,
  valor TEXT NOT NULL,
  descripcion TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

INSERT INTO parametros_sistema (clave, valor, descripcion) VALUES
  ('multiplicador_funnel', '10', 'Funnel mínimo = X veces la meta mensual'),
  ('dias_antiaca_recordatorio', '7', 'Días sin actividad antes del recordatorio'),
  ('dias_antiaca_advertencia', '15', 'Días antes de advertencia al gerente'),
  ('dias_antiaca_justificacion', '30', 'Días antes de requerir justificación'),
  ('dias_antiaca_liberacion', '35', 'Días antes de liberar el lead'),
  ('margen_minimo_cotizacion', '15', '% de margen mínimo sin aprobación'),
  ('umbral_ocioso_info', '3', 'Horas sin asignación para nivel info'),
  ('umbral_ocioso_advertencia', '5', 'Horas para alerta a CS'),
  ('umbral_ocioso_critico', '12', 'Horas para alerta P0'),
  ('umbral_ocioso_inaceptable', '24', 'Horas nivel inaceptable'),
  ('minutos_detenida_info', '30', 'Minutos detenida para nivel info'),
  ('minutos_detenida_alerta', '60', 'Minutos para alerta'),
  ('minutos_detenida_critico', '120', 'Minutos para nivel crítico'),
  ('sla_respuesta_whatsapp_min', '10', 'Minutos SLA respuesta WhatsApp'),
  ('sla_respuesta_correo_min', '60', 'Minutos SLA respuesta correo'),
  ('hora_resumen_8am', '08:00', 'Hora del briefing operativo diario'),
  ('frecuencia_gps_minutos', '10', 'Frecuencia de actualización GPS en minutos');


================================================================================
-- MIGRATION 003: Clientes y Contactos (Clients and Contacts)
================================================================================

CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  razon_social TEXT NOT NULL,
  rfc TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('prospecto','activo','corporativo','estrategico','bloqueado')),
  segmento TEXT,
  prioridad TEXT DEFAULT 'normal' CHECK (prioridad IN ('normal','alta','estrategica')),
  empresa TEXT,
  ejecutivo_asignado UUID REFERENCES auth.users(id),
  ejecutiva_cs UUID REFERENCES auth.users(id),
  fecha_alta TIMESTAMPTZ DEFAULT NOW(),
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contactos_clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  nombre TEXT NOT NULL,
  cargo TEXT,
  telefono TEXT,
  email TEXT,
  whatsapp TEXT,
  cumpleanos DATE,
  es_principal BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contratos_clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  fecha_inicio DATE,
  fecha_fin DATE,
  condiciones TEXT,
  archivo_url TEXT,
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo','vencido','cancelado')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE corporativos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  corporativo_id UUID NOT NULL REFERENCES clientes(id),
  subsidiaria_id UUID NOT NULL REFERENCES clientes(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(corporativo_id, subsidiaria_id)
);


================================================================================
-- MIGRATION 004: Leads y Ventas (Leads and Sales)
================================================================================

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa TEXT NOT NULL,
  contacto TEXT,
  telefono TEXT,
  email TEXT,
  ciudad TEXT,
  ruta_interes TEXT,
  tipo_carga TEXT,
  fuente TEXT DEFAULT 'manual',
  ejecutivo_id UUID REFERENCES auth.users(id),
  estado TEXT DEFAULT 'nuevo' CHECK (estado IN ('nuevo','contactado','cotizacion','negociacion','ganado','perdido','congelado')),
  motivo_perdida TEXT,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
  fecha_ultimo_mov TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE oportunidades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES clientes(id),
  lead_id UUID REFERENCES leads(id),
  ejecutivo_id UUID NOT NULL REFERENCES auth.users(id),
  etapa TEXT NOT NULL DEFAULT 'nuevo',
  valor_economico NUMERIC(15,2) DEFAULT 0,
  probabilidad INTEGER DEFAULT 0,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
  fecha_ultimo_mov TIMESTAMPTZ DEFAULT NOW(),
  fecha_cierre_estimada DATE,
  motivo_perdida TEXT,
  notas TEXT,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE actividades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL CHECK (tipo IN ('llamada','visita','correo','whatsapp','reunion','nota')),
  usuario_id UUID NOT NULL REFERENCES auth.users(id),
  cliente_id UUID REFERENCES clientes(id),
  lead_id UUID REFERENCES leads(id),
  oportunidad_id UUID REFERENCES oportunidades(id),
  fecha TIMESTAMPTZ DEFAULT NOW(),
  duracion_min INTEGER,
  resultado TEXT,
  notas TEXT,
  lat NUMERIC(10,6),
  lng NUMERIC(10,6)
);

CREATE TABLE metas_ejecutivos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id),
  mes INTEGER NOT NULL,
  anio INTEGER NOT NULL,
  meta_monto NUMERIC(15,2) DEFAULT 0,
  meta_llamadas INTEGER DEFAULT 0,
  meta_visitas INTEGER DEFAULT 0,
  UNIQUE(usuario_id, mes, anio)
);


================================================================================
-- MIGRATION 005: Cotizaciones (Quotations)
================================================================================

CREATE TABLE cotizaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES clientes(id),
  ejecutivo_id UUID NOT NULL REFERENCES auth.users(id),
  oportunidad_id UUID REFERENCES oportunidades(id),
  ruta_origen TEXT,
  ruta_destino TEXT,
  tipo_equipo TEXT,
  tipo_servicio TEXT,
  tarifa NUMERIC(15,2),
  costo_base NUMERIC(15,2),
  margen_pct NUMERIC(5,2),
  estado TEXT DEFAULT 'borrador' CHECK (estado IN ('borrador','enviada','vista','aceptada','rechazada','vencida')),
  version INTEGER DEFAULT 1,
  requirio_aprobacion BOOLEAN DEFAULT false,
  aprobado_por UUID REFERENCES auth.users(id),
  fecha_envio TIMESTAMPTZ,
  fecha_apertura TIMESTAMPTZ,
  fecha_vencimiento DATE,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE catalogo_tarifas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  origen TEXT NOT NULL,
  destino TEXT NOT NULL,
  tipo_equipo TEXT NOT NULL,
  empresa TEXT,
  tarifa_base NUMERIC(15,2),
  costo_base NUMERIC(15,2),
  activo BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


================================================================================
-- MIGRATION 006: Flota y Operaciones (Fleet and Operations)
================================================================================

CREATE TABLE tractos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_economico TEXT NOT NULL UNIQUE,
  empresa TEXT NOT NULL,
  segmento TEXT,
  estado_operativo TEXT DEFAULT 'disponible',
  operador_actual_id UUID,
  km_acumulados INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cajas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_economico TEXT NOT NULL UNIQUE,
  empresa TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('seco','refrigerado')),
  estado TEXT DEFAULT 'disponible',
  ubicacion_actual TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE operadores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  licencia TEXT,
  telefono TEXT,
  empresa TEXT,
  estado TEXT DEFAULT 'disponible' CHECK (estado IN ('disponible','en_viaje','descanso','incapacidad','baja')),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE formatos_venta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  empresa TEXT,
  origen TEXT,
  destino TEXT,
  tipo_servicio TEXT CHECK (tipo_servicio IN ('IMPO','EXPO','NAC','DEDICADO')),
  tipo_equipo TEXT,
  tarifa NUMERIC(15,2),
  activo BOOLEAN DEFAULT true,
  fecha_ultima_activacion TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE viajes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  formato_venta_id UUID REFERENCES formatos_venta(id),
  tracto_id UUID REFERENCES tractos(id),
  caja_id UUID REFERENCES cajas(id),
  operador_id UUID REFERENCES operadores(id),
  cs_asignada UUID REFERENCES auth.users(id),
  origen TEXT NOT NULL,
  destino TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('IMPO','EXPO','NAC')),
  fecha_salida TIMESTAMPTZ,
  cita_carga TIMESTAMPTZ,
  cita_descarga TIMESTAMPTZ NOT NULL,
  eta_calculado TIMESTAMPTZ,
  estado TEXT DEFAULT 'programado',
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE trazabilidad_viajes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  viaje_id UUID NOT NULL REFERENCES viajes(id),
  evento TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  latitud NUMERIC(10,6),
  longitud NUMERIC(10,6),
  descripcion TEXT,
  usuario_id UUID REFERENCES auth.users(id)
);

CREATE TABLE incidencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  viaje_id UUID REFERENCES viajes(id),
  tracto_id UUID REFERENCES tractos(id),
  tipo TEXT NOT NULL,
  descripcion TEXT,
  estado TEXT DEFAULT 'abierta' CHECK (estado IN ('abierta','en_proceso','cerrada')),
  responsable_id UUID REFERENCES auth.users(id),
  fecha_apertura TIMESTAMPTZ DEFAULT NOW(),
  fecha_cierre TIMESTAMPTZ
);


================================================================================
-- MIGRATION 007: GPS Tracking
================================================================================

CREATE TABLE gps_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  economico TEXT NOT NULL UNIQUE,
  empresa TEXT,
  segmento TEXT,
  latitud NUMERIC(10,6),
  longitud NUMERIC(10,6),
  velocidad NUMERIC(6,2) DEFAULT 0,
  ubicacion TEXT,
  estatus TEXT,
  ultima_actualizacion TIMESTAMPTZ DEFAULT NOW(),
  estado_geo TEXT,
  municipio_geo TEXT
);

CREATE INDEX idx_gps_economico ON gps_tracking(economico);
CREATE INDEX idx_gps_empresa ON gps_tracking(empresa);
CREATE INDEX idx_gps_segmento ON gps_tracking(segmento);

CREATE TABLE gps_historial (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  economico TEXT NOT NULL,
  latitud NUMERIC(10,6),
  longitud NUMERIC(10,6),
  velocidad NUMERIC(6,2),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gps_hist_economico ON gps_historial(economico);
CREATE INDEX idx_gps_hist_timestamp ON gps_historial(timestamp);


================================================================================
-- MIGRATION 008: Comunicaciones (Communications)
================================================================================

CREATE TABLE whatsapp_mensajes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_origen TEXT NOT NULL,
  cliente_id UUID REFERENCES clientes(id),
  direccion TEXT NOT NULL CHECK (direccion IN ('entrante','saliente')),
  contenido TEXT,
  tipo TEXT DEFAULT 'texto',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  ejecutiva_id UUID REFERENCES auth.users(id),
  tiempo_respuesta_min INTEGER,
  en_sla BOOLEAN
);

CREATE TABLE whatsapp_numeros_autorizados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  numero TEXT NOT NULL,
  nombre_contacto TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cliente_id, numero)
);

CREATE TABLE correos_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES clientes(id),
  usuario_id UUID REFERENCES auth.users(id),
  asunto TEXT,
  tipo TEXT,
  estado TEXT DEFAULT 'enviado',
  timestamp_envio TIMESTAMPTZ DEFAULT NOW(),
  timestamp_apertura TIMESTAMPTZ
);


================================================================================
-- MIGRATION 009: CXC y Cobranza (Accounts Receivable and Collections)
================================================================================

CREATE TABLE cxc_cartera (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) UNIQUE,
  ejecutivo_cxc_id UUID REFERENCES auth.users(id),
  saldo_total NUMERIC(15,2) DEFAULT 0,
  saldo_vencido NUMERIC(15,2) DEFAULT 0,
  dias_credito_pactados INTEGER DEFAULT 30,
  dias_promedio_pago INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cxc_facturas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  folio TEXT,
  monto NUMERIC(15,2),
  fecha_emision DATE,
  fecha_vencimiento DATE,
  estado TEXT DEFAULT 'vigente' CHECK (estado IN ('vigente','vencida','pagada'))
);


================================================================================
-- MIGRATION 010: Auditoría (Audit Log)
================================================================================

CREATE TABLE auditoria_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES auth.users(id),
  tabla TEXT NOT NULL,
  registro_id UUID,
  accion TEXT NOT NULL CHECK (accion IN ('INSERT','UPDATE','DELETE','LOGIN','LOGOUT')),
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  ip_address TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_tabla ON auditoria_log(tabla);
CREATE INDEX idx_audit_usuario ON auditoria_log(usuario_id);
CREATE INDEX idx_audit_timestamp ON auditoria_log(timestamp);


================================================================================
-- MIGRATION 011: Índices Adicionales de Performance
================================================================================

-- Clientes
CREATE INDEX idx_clientes_ejecutivo ON clientes(ejecutivo_asignado);
CREATE INDEX idx_clientes_empresa ON clientes(empresa);
CREATE INDEX idx_clientes_tipo ON clientes(tipo);
CREATE INDEX idx_clientes_rfc ON clientes(rfc);

-- Leads
CREATE INDEX idx_leads_ejecutivo ON leads(ejecutivo_id);
CREATE INDEX idx_leads_estado ON leads(estado);
CREATE INDEX idx_leads_fecha ON leads(fecha_ultimo_mov);

-- Viajes
CREATE INDEX idx_viajes_cliente ON viajes(cliente_id);
CREATE INDEX idx_viajes_estado ON viajes(estado);
CREATE INDEX idx_viajes_fecha ON viajes(fecha_salida);
CREATE INDEX idx_viajes_cs ON viajes(cs_asignada);

-- Actividades
CREATE INDEX idx_actividades_usuario ON actividades(usuario_id);
CREATE INDEX idx_actividades_cliente ON actividades(cliente_id);
CREATE INDEX idx_actividades_fecha ON actividades(fecha);

-- WhatsApp
CREATE INDEX idx_wa_numero ON whatsapp_mensajes(numero_origen);
CREATE INDEX idx_wa_cliente ON whatsapp_mensajes(cliente_id);
CREATE INDEX idx_wa_timestamp ON whatsapp_mensajes(timestamp);


================================================================================
-- MIGRATION 012: Row Level Security (RLS) Policies
-- EXECUTE AFTER ALL TABLES ABOVE
================================================================================

-- PASO 1: Habilitar RLS en cada tabla
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE oportunidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE viajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tractos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cajas ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_mensajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE cxc_cartera ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE parametros_sistema ENABLE ROW LEVEL SECURITY;

-- === CLIENTES ===
CREATE POLICY "clientes_admin_todo" ON clientes FOR ALL USING (is_direccion());
CREATE POLICY "clientes_ventas_suyos" ON clientes FOR SELECT USING (get_user_rol() = 'ventas' AND ejecutivo_asignado = auth.uid());
CREATE POLICY "clientes_gerente_com" ON clientes FOR SELECT USING (get_user_rol() = 'gerente_comercial');
CREATE POLICY "clientes_cs_empresa" ON clientes FOR SELECT USING (get_user_rol() IN ('cs', 'supervisor_cs') AND empresa = get_user_empresa());
CREATE POLICY "clientes_cxc" ON clientes FOR SELECT USING (get_user_rol() = 'cxc');
CREATE POLICY "clientes_ops" ON clientes FOR SELECT USING (get_user_rol() IN ('operaciones', 'gerente_ops'));

-- === LEADS ===
CREATE POLICY "leads_admin" ON leads FOR ALL USING (is_admin());
CREATE POLICY "leads_gerente_com" ON leads FOR SELECT USING (get_user_rol() = 'gerente_comercial');
CREATE POLICY "leads_direccion" ON leads FOR SELECT USING (get_user_rol() = 'direccion');
CREATE POLICY "leads_ventas_suyos" ON leads FOR ALL USING (get_user_rol() = 'ventas' AND ejecutivo_id = auth.uid());

-- === OPORTUNIDADES ===
CREATE POLICY "opps_admin" ON oportunidades FOR ALL USING (is_admin());
CREATE POLICY "opps_gerente" ON oportunidades FOR SELECT USING (get_user_rol() IN ('gerente_comercial', 'direccion'));
CREATE POLICY "opps_ventas_suyas" ON oportunidades FOR ALL USING (get_user_rol() = 'ventas' AND ejecutivo_id = auth.uid());

-- === COTIZACIONES ===
CREATE POLICY "cot_admin" ON cotizaciones FOR ALL USING (is_admin());
CREATE POLICY "cot_pricing" ON cotizaciones FOR ALL USING (get_user_rol() = 'pricing');
CREATE POLICY "cot_gerente" ON cotizaciones FOR SELECT USING (get_user_rol() IN ('gerente_comercial', 'direccion'));
CREATE POLICY "cot_ventas_suyas" ON cotizaciones FOR ALL USING (get_user_rol() = 'ventas' AND ejecutivo_id = auth.uid());

-- === VIAJES ===
CREATE POLICY "viajes_admin" ON viajes FOR ALL USING (is_admin());
CREATE POLICY "viajes_ops" ON viajes FOR ALL USING (get_user_rol() IN ('operaciones', 'gerente_ops'));
CREATE POLICY "viajes_cs" ON viajes FOR SELECT USING (get_user_rol() IN ('cs', 'supervisor_cs') AND cs_asignada = auth.uid());
CREATE POLICY "viajes_cs_crear" ON viajes FOR INSERT WITH CHECK (get_user_rol() IN ('cs', 'supervisor_cs', 'admin'));
CREATE POLICY "viajes_direccion" ON viajes FOR SELECT USING (get_user_rol() IN ('direccion', 'gerente_ops'));

-- === GPS TRACKING ===
CREATE POLICY "gps_lectura" ON gps_tracking FOR SELECT USING (get_user_rol() IN ('superadmin', 'admin', 'cs', 'supervisor_cs', 'operaciones', 'gerente_ops', 'direccion'));

-- === CXC CARTERA ===
CREATE POLICY "cxc_admin" ON cxc_cartera FOR ALL USING (is_admin());
CREATE POLICY "cxc_ejecutivos" ON cxc_cartera FOR ALL USING (get_user_rol() = 'cxc' AND ejecutivo_cxc_id = auth.uid());
CREATE POLICY "cxc_direccion" ON cxc_cartera FOR SELECT USING (get_user_rol() = 'direccion');

-- === ACTIVIDADES ===
CREATE POLICY "act_admin" ON actividades FOR ALL USING (is_admin());
CREATE POLICY "act_propio" ON actividades FOR ALL USING (usuario_id = auth.uid());
CREATE POLICY "act_gerente" ON actividades FOR SELECT USING (get_user_rol() IN ('gerente_comercial', 'supervisor_cs', 'direccion'));

-- === PARÁMETROS SISTEMA ===
CREATE POLICY "params_lectura" ON parametros_sistema FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "params_escritura" ON parametros_sistema FOR ALL USING (is_admin());

-- === AUDITORÍA ===
CREATE POLICY "audit_admin" ON auditoria_log FOR SELECT USING (is_admin());

-- === WHATSAPP ===
CREATE POLICY "wa_admin" ON whatsapp_mensajes FOR ALL USING (is_admin());
CREATE POLICY "wa_cs" ON whatsapp_mensajes FOR SELECT USING (get_user_rol() IN ('cs', 'supervisor_cs'));


================================================================================
-- END OF MIGRATIONS
================================================================================
-- Schema migration complete. All tables, indexes, and RLS policies are now set.
================================================================================
