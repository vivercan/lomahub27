-- 006: Flota y operaciones
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
