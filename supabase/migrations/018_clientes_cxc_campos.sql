-- 018: Campos faltantes en clientes y cxc_cartera
-- Ejecutar en Supabase SQL Editor ANTES de hacer deploy del frontend que los usa.
-- Idempotente: usa IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.

-- ═══════════════════════════════════════════════════════════════
-- 1. CLIENTES — campos de contacto directo de la empresa
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS contacto_nombre TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS telefono TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS ciudad TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS estado_mx TEXT;

-- Índice para búsqueda por ciudad/estado
CREATE INDEX IF NOT EXISTS idx_clientes_ciudad ON clientes(ciudad);
CREATE INDEX IF NOT EXISTS idx_clientes_estado_mx ON clientes(estado_mx);

-- ═══════════════════════════════════════════════════════════════
-- 2. CXC_CARTERA — campos para gestión de cobro
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE cxc_cartera ADD COLUMN IF NOT EXISTS ultimo_contacto TIMESTAMPTZ;
ALTER TABLE cxc_cartera ADD COLUMN IF NOT EXISTS estatus_cobro TEXT DEFAULT 'Pendiente'
  CHECK (estatus_cobro IN ('Pendiente', 'En gestión', 'Comprometido', 'Escalado', 'Resuelto'));

-- ═══════════════════════════════════════════════════════════════
-- 3. RLS — políticas para nuevos campos (heredan de tabla padre)
-- No se requiere acción adicional — RLS aplica a nivel fila, no columna.
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- 4. NOTA: La tabla \'corporativos\' ya existe (003_clientes.sql)
-- con corporativo_id → subsidiaria_id para relaciones matriz.
-- El frontend (CorporativosClientes.tsx) debe hacer JOIN a esta tabla.
-- ═══════════════════════════════════════════════════════════════
