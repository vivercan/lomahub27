-- 009: CXC y cobranza
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
