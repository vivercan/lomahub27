-- 008: Comunicaciones
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
