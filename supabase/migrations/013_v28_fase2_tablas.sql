-- =====================================================
-- MIGRACIÓN 013 — Tablas Fase 2 (componentes sesión 19)
-- Fecha: 22/Mar/2026
-- Referencia: Backlog página 47 — Fase 2 completada
-- EJECUTAR EN: Supabase SQL Editor
-- REQUIERE: Migración 012 ya ejecutada
-- =====================================================

-- ─── 1. PROSPECCION_EXTERNA (Apollo.io + Hunter.io) ───
CREATE TABLE IF NOT EXISTS prospeccion_externa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa TEXT NOT NULL,
  dominio TEXT,
  industria TEXT,
  tamano TEXT CHECK (tamano IN ('1-10','11-50','51-200','201-500','501-1000','1000+')),
  ubicacion TEXT,
  contacto_nombre TEXT,
  contacto_puesto TEXT,
  contacto_email TEXT,
  contacto_telefono TEXT,
  contacto_linkedin TEXT,
  fuente TEXT CHECK (fuente IN ('apollo','hunter','manual','referido')),
  estado TEXT DEFAULT 'identificado' CHECK (estado IN ('identificado','contacto_encontrado','enriquecido','importado_leads','descartado')),
  score_fit INTEGER DEFAULT 0 CHECK (score_fit >= 0 AND score_fit <= 100),
  lead_id UUID REFERENCES leads(id),
  notas TEXT,
  enriquecido_at TIMESTAMPTZ,
  importado_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prospeccion_externa_estado ON prospeccion_externa(estado);
CREATE INDEX IF NOT EXISTS idx_prospeccion_externa_fuente ON prospeccion_externa(fuente);

-- ─── 2. CRUCE_DOCUMENTOS (tracking docs aduanales IMPO/EXPO) ───
CREATE TABLE IF NOT EXISTS cruce_documentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  viaje_id UUID REFERENCES viajes(id),
  tipo_operacion TEXT NOT NULL CHECK (tipo_operacion IN ('IMPO','EXPO')),
  cruce TEXT,
  pedimento TEXT,
  factura_comercial BOOLEAN DEFAULT false,
  packing_list BOOLEAN DEFAULT false,
  carta_porte BOOLEAN DEFAULT false,
  certificado_origen BOOLEAN DEFAULT false,
  permiso_previo BOOLEAN DEFAULT false,
  pedimento_pagado BOOLEAN DEFAULT false,
  inspeccion_aduana TEXT DEFAULT 'pendiente' CHECK (inspeccion_aduana IN ('pendiente','aprobada','rechazada','no_requerida')),
  estatus_semaforo TEXT DEFAULT 'rojo' CHECK (estatus_semaforo IN ('verde','amarillo','rojo')),
  notas TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cruce_documentos_viaje ON cruce_documentos(viaje_id);
CREATE INDEX IF NOT EXISTS idx_cruce_documentos_semaforo ON cruce_documentos(estatus_semaforo);

-- ─── 3. COTIZACION_FIRMAS (firma digital en cotizaciones) ───
CREATE TABLE IF NOT EXISTS cotizacion_firmas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cotizacion_id UUID REFERENCES cotizaciones(id),
  cliente_id UUID REFERENCES clientes(id),
  contacto_nombre TEXT NOT NULL,
  contacto_email TEXT NOT NULL,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente','enviada','firmada','rechazada','vencida')),
  token_firma UUID DEFAULT uuid_generate_v4() UNIQUE,
  firma_hash TEXT,
  firma_ip TEXT,
  firma_user_agent TEXT,
  firma_timestamp TIMESTAMPTZ,
  enviado_at TIMESTAMPTZ,
  vence_at TIMESTAMPTZ,
  recordatorio_enviado BOOLEAN DEFAULT false,
  motivo_rechazo TEXT,
  notas TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cotizacion_firmas_cotizacion ON cotizacion_firmas(cotizacion_id);
CREATE INDEX IF NOT EXISTS idx_cotizacion_firmas_estado ON cotizacion_firmas(estado);
CREATE INDEX IF NOT EXISTS idx_cotizacion_firmas_token ON cotizacion_firmas(token_firma);

-- ─── 4. CONTROL_TEMPERATURA (monitoreo refrigerados) ───
CREATE TABLE IF NOT EXISTS control_temperatura (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  viaje_id UUID REFERENCES viajes(id),
  tracto_id UUID REFERENCES tractos(id),
  caja_id UUID REFERENCES cajas(id),
  operador TEXT,
  cliente_nombre TEXT,
  ruta TEXT,
  temp_configurada NUMERIC(5,2),
  temp_actual NUMERIC(5,2),
  temp_min_registrada NUMERIC(5,2),
  temp_max_registrada NUMERIC(5,2),
  desviacion NUMERIC(5,2) DEFAULT 0,
  unidad_temp TEXT DEFAULT 'C' CHECK (unidad_temp IN ('C','F')),
  estado TEXT DEFAULT 'normal' CHECK (estado IN ('normal','alerta','critico','sin_datos')),
  ultima_lectura TIMESTAMPTZ,
  alertas_enviadas INTEGER DEFAULT 0,
  notas TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_control_temp_viaje ON control_temperatura(viaje_id);
CREATE INDEX IF NOT EXISTS idx_control_temp_estado ON control_temperatura(estado);

-- ─── 5. ALERTAS_PROACTIVAS (comunicación pre-cita) ───
CREATE TABLE IF NOT EXISTS alertas_proactivas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  viaje_id UUID REFERENCES viajes(id),
  cliente_id UUID REFERENCES clientes(id),
  cliente_nombre TEXT NOT NULL,
  contacto_nombre TEXT,
  contacto_telefono TEXT,
  contacto_email TEXT,
  origen TEXT,
  destino TEXT,
  cita_descarga TIMESTAMPTZ NOT NULL,
  eta_actual TIMESTAMPTZ,
  diferencia_min INTEGER DEFAULT 0,
  riesgo TEXT DEFAULT 'sin_riesgo' CHECK (riesgo IN ('sin_riesgo','riesgo_leve','riesgo_alto','retraso_confirmado')),
  notificado BOOLEAN DEFAULT false,
  canal_notificacion TEXT CHECK (canal_notificacion IN ('whatsapp','email','sms')),
  fecha_notificacion TIMESTAMPTZ,
  tracto_numero TEXT,
  operador TEXT,
  notas_automaticas TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alertas_proactivas_viaje ON alertas_proactivas(viaje_id);
CREATE INDEX IF NOT EXISTS idx_alertas_proactivas_riesgo ON alertas_proactivas(riesgo);
CREATE INDEX IF NOT EXISTS idx_alertas_proactivas_cita ON alertas_proactivas(cita_descarga);

-- ─── 6. ESCALAMIENTOS_WHATSAPP (escalamiento a supervisor/gerencia) ───
CREATE TABLE IF NOT EXISTS escalamientos_whatsapp (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES tickets(id),
  viaje_id UUID REFERENCES viajes(id),
  cliente_id UUID REFERENCES clientes(id),
  cliente_nombre TEXT NOT NULL,
  contacto_nombre TEXT NOT NULL,
  contacto_telefono TEXT,
  canal_origen TEXT DEFAULT 'whatsapp' CHECK (canal_origen IN ('whatsapp','email','telefono')),
  motivo TEXT NOT NULL,
  descripcion TEXT,
  nivel_escalamiento INTEGER DEFAULT 1 CHECK (nivel_escalamiento IN (1, 2, 3)),
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente','asignado','en_proceso','resuelto','cerrado')),
  asignado_a UUID REFERENCES auth.users(id),
  asignado_nombre TEXT,
  prioridad TEXT DEFAULT 'media' CHECK (prioridad IN ('baja','media','alta','urgente')),
  tiempo_respuesta_min INTEGER,
  resolucion TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escalamientos_estado ON escalamientos_whatsapp(estado);
CREATE INDEX IF NOT EXISTS idx_escalamientos_nivel ON escalamientos_whatsapp(nivel_escalamiento);
CREATE INDEX IF NOT EXISTS idx_escalamientos_prioridad ON escalamientos_whatsapp(prioridad);
CREATE INDEX IF NOT EXISTS idx_escalamientos_cliente ON escalamientos_whatsapp(cliente_id);

-- ─── RLS POLICIES ───
ALTER TABLE prospeccion_externa ENABLE ROW LEVEL SECURITY;
ALTER TABLE cruce_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizacion_firmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_temperatura ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas_proactivas ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalamientos_whatsapp ENABLE ROW LEVEL SECURITY;

-- Lectura para autenticados
CREATE POLICY "Lectura autenticados" ON prospeccion_externa FOR SELECT TO authenticated USING (true);
CREATE POLICY "Escritura autenticados" ON prospeccion_externa FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Lectura autenticados" ON cruce_documentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Escritura autenticados" ON cruce_documentos FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Lectura autenticados" ON cotizacion_firmas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Escritura autenticados" ON cotizacion_firmas FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Lectura autenticados" ON control_temperatura FOR SELECT TO authenticated USING (true);
CREATE POLICY "Escritura autenticados" ON control_temperatura FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Lectura autenticados" ON alertas_proactivas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Escritura autenticados" ON alertas_proactivas FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Lectura autenticados" ON escalamientos_whatsapp FOR SELECT TO authenticated USING (true);
CREATE POLICY "Escritura autenticados" ON escalamientos_whatsapp FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================
-- FIN MIGRACIÓN 013
-- Ejecutar DESPUÉS de migración 012 en Supabase SQL Editor
-- =====================================================
