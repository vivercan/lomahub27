-- 003: Clientes y contactos
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
