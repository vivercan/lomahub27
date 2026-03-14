-- 002: Catálogos del sistema
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
