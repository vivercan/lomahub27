-- 017: Auto-classify tipo_unidad on every INSERT/UPDATE to gps_tracking
-- Problem: The GPS worker upserts all records with tipo_unidad='tracto' by default,
-- overwriting any manual classification from migration 016.
-- Solution: A BEFORE trigger that auto-classifies based on tractos table membership.
-- Logic: If economico is in tractos table → tracto. Otherwise → caja.
-- This works because WideTech uses different economico numbers for cajas,
-- so we classify by exclusion: anything NOT a known tracto is a caja.

-- Create function to auto-classify tipo_unidad
CREATE OR REPLACE FUNCTION fn_classify_tipo_unidad()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM tractos WHERE numero_economico = NEW.economico) THEN
    NEW.tipo_unidad := 'tracto';
  ELSE
    NEW.tipo_unidad := 'caja';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trg_classify_tipo_unidad ON gps_tracking;

-- Create trigger BEFORE INSERT OR UPDATE
CREATE TRIGGER trg_classify_tipo_unidad
  BEFORE INSERT OR UPDATE ON gps_tracking
  FOR EACH ROW
  EXECUTE FUNCTION fn_classify_tipo_unidad();

-- Re-classify all existing records
UPDATE gps_tracking SET tipo_unidad = 'tracto'
WHERE economico IN (SELECT numero_economico FROM tractos);

UPDATE gps_tracking SET tipo_unidad = 'caja'
WHERE economico NOT IN (SELECT numero_economico FROM tractos);
