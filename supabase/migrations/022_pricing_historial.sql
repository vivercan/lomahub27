-- Historial de cambios en Cerebro Tarifario
CREATE TABLE IF NOT EXISTS pricing_historial (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tabla TEXT NOT NULL,
  registro_id TEXT NOT NULL,
  campo TEXT NOT NULL,
  valor_anterior TEXT,
  valor_nuevo TEXT,
  usuario TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_pricing_historial_created ON pricing_historial(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pricing_historial_tabla ON pricing_historial(tabla);

-- RLS
ALTER TABLE pricing_historial ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pricing_historial_select" ON pricing_historial
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "pricing_historial_insert" ON pricing_historial
  FOR INSERT TO authenticated WITH CHECK (true);
