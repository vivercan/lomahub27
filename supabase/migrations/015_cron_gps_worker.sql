-- Migracion 015: Cron job para GPS Worker cada 10 minutos
-- LomaHUB27 -- Actualizacion automatica de posiciones GPS desde WideTech
-- Requiere extensiones: pg_cron, pg_net

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Cron: cada 10 minutos ejecutar gps-worker
SELECT cron.schedule(
    'gps-worker-10min',
    '*/10 * * * *',
    $$
  SELECT net.http_post(
      url := 'https://wtogsqxvyfeibnfxfbev.supabase.co/functions/v1/gps-worker',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0b2dzcXh2eWZlaWJuZnhmYmV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQ3Mzc1MywiZXhwIjoyMDg5MDQ5NzUzfQ.OEE0VGbM0N-77um9aAZ0zXzh116MG4EZMoM0grUijjA'
      ),
      body := '{}'::jsonb
    );
  $$
);
