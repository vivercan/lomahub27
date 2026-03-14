-- Migración 014: Cron job para monitoreo de tractos ociosos cada hora
-- LomaHUB27 — alerta-engine periodic check
-- Requiere extensiones: pg_cron, pg_net (activar en Supabase Dashboard → Extensions)

-- Habilitar extensiones si no están activas
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Cron: cada hora revisar tractos ociosos
SELECT cron.schedule(
  'alerta-tractos-ociosos',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://wtogsqxvyfeibnfxfbev.supabase.co/functions/v1/alerta-engine',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0b2dzcXh2eWZlaWJuZnhmYmV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQ3Mzc1MywiZXhwIjoyMDg5MDQ5NzUzfQ.OEE0VGbM0N-77um9aAZ0zXzh116MG4EZMoM0grUijjA'
    ),
    body := '{"tipo":"check_tractos_ociosos"}'::jsonb
  );
  $$
);

-- Cron: cada 30 minutos revisar citas en riesgo
SELECT cron.schedule(
  'alerta-citas-en-riesgo',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://wtogsqxvyfeibnfxfbev.supabase.co/functions/v1/alerta-engine',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0b2dzcXh2eWZlaWJuZnhmYmV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQ3Mzc1MywiZXhwIjoyMDg5MDQ5NzUzfQ.OEE0VGbM0N-77um9aAZ0zXzh116MG4EZMoM0grUijjA'
    ),
    body := '{"tipo":"check_citas_en_riesgo"}'::jsonb
  );
  $$
);

-- Cron: cada 15 minutos revisar unidades detenidas
SELECT cron.schedule(
  'alerta-unidades-detenidas',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://wtogsqxvyfeibnfxfbev.supabase.co/functions/v1/alerta-engine',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0b2dzcXh2eWZlaWJuZnhmYmV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQ3Mzc1MywiZXhwIjoyMDg5MDQ5NzUzfQ.OEE0VGbM0N-77um9aAZ0zXzh116MG4EZMoM0grUijjA'
    ),
    body := '{"tipo":"check_unidades_detenidas"}'::jsonb
  );
  $$
);
