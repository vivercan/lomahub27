-- 010: Auditoría
CREATE TABLE auditoria_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES auth.users(id),
  tabla TEXT NOT NULL,
  registro_id UUID,
  accion TEXT NOT NULL CHECK (accion IN ('INSERT','UPDATE','DELETE','LOGIN','LOGOUT')),
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  ip_address TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_tabla ON auditoria_log(tabla);
CREATE INDEX idx_audit_usuario ON auditoria_log(usuario_id);
CREATE INDEX idx_audit_timestamp ON auditoria_log(timestamp);
