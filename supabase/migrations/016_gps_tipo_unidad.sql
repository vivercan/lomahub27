-- 016: Master GPS — agregar tipo_unidad para clasificar tractos vs cajas
-- Regla: gps_tracking es el MASTER de toda la flota con GPS

ALTER TABLE gps_tracking ADD COLUMN IF NOT EXISTS tipo_unidad TEXT DEFAULT 'tracto';

-- Clasificar unidades existentes basándose en el campo segmento
-- Si segmento contiene 'trailer' → caja
UPDATE gps_tracking SET tipo_unidad = 'caja' WHERE LOWER(segmento) LIKE '%trailer%';

-- También clasificar por cruce con tabla tractos (match exacto por economico)
UPDATE gps_tracking SET tipo_unidad = 'tracto'
WHERE economico IN (SELECT numero_economico FROM tractos);

-- Las que no son tractos conocidos y tienen segmento 'tracto' explícito
UPDATE gps_tracking SET tipo_unidad = 'tracto' WHERE LOWER(segmento) = 'tracto';

-- Unidades GPS que NO están en tractos y NO son trailer explícito → clasificar por contexto
-- Si el economico existe en cajas → es caja
UPDATE gps_tracking SET tipo_unidad = 'caja'
WHERE economico IN (SELECT numero_economico FROM cajas)
AND tipo_unidad = 'tracto';

-- Índice para filtrar rápido por tipo
CREATE INDEX IF NOT EXISTS idx_gps_tipo_unidad ON gps_tracking(tipo_unidad);
