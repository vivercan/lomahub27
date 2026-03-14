-- Migración 013: Tabla alertas_pendientes para el motor de alertas
-- LomaHUB27 — alerta-engine Edge Function

CREATE TABLE IF NOT EXISTS alertas_pendientes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo text NOT NULL,
  viaje_id uuid REFERENCES viajes(id),
  tracto_id uuid,
  datos jsonb DEFAULT '{}'::jsonb,
  canal text[] DEFAULT ARRAY['whatsapp','email'],
  procesada boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  procesada_at timestamptz,
  resultado text
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_alertas_tipo ON alertas_pendientes(tipo);
CREATE INDEX IF NOT EXISTS idx_alertas_procesada ON alertas_pendientes(procesada) WHERE procesada = false;
CREATE INDEX IF NOT EXISTS idx_alertas_viaje ON alertas_pendientes(viaje_id) WHERE viaje_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_alertas_tracto ON alertas_pendientes(tracto_id) WHERE tracto_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_alertas_created ON alertas_pendientes(created_at DESC);

-- RLS
ALTER TABLE alertas_pendientes ENABLE ROW LEVEL SECURITY;

-- Superadmin y admin ven todas las alertas
CREATE POLICY "alertas_admin_all" ON alertas_pendientes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND (raw_app_meta_data->>'rol')::text IN ('superadmin', 'admin', 'direccion')
    )
  );

-- Operaciones y CS pueden ver alertas
CREATE POLICY "alertas_ops_cs_select" ON alertas_pendientes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND (raw_app_meta_data->>'rol')::text IN ('operaciones', 'gerente_ops', 'cs', 'supervisor_cs')
    )
  );

-- Service role puede hacer todo (Edge Functions)
CREATE POLICY "alertas_service_role" ON alertas_pendientes
  FOR ALL USING (auth.role() = 'service_role');

-- Agregar campo eta_calculado a viajes si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'viajes' AND column_name = 'eta_calculado'
  ) THEN
    ALTER TABLE viajes ADD COLUMN eta_calculado timestamptz;
  END IF;
END $$;

-- Agregar parámetros del sistema para alertas
INSERT INTO parametros_sistema (clave, valor, descripcion) VALUES
  ('umbral_ocioso_aviso', '4', 'Horas para aviso de tracto ocioso'),
  ('umbral_ocioso_alerta', '8', 'Horas para alerta de tracto ocioso'),
  ('umbral_ocioso_critica', '12', 'Horas para alerta crítica de tracto ocioso'),
  ('costo_hora_tracto', '250', 'Costo por hora de tracto ocioso (MXN)'),
  ('umbral_cita_riesgo_min', '30', 'Minutos de retraso sobre cita para alerta de riesgo')
ON CONFLICT (clave) DO NOTHING;
