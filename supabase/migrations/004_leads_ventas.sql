-- 004: Leads y ventas
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
