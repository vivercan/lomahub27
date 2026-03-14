-- 005: Cotizaciones
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
