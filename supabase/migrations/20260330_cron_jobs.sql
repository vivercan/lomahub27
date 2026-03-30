-- ============================================================
-- LomaHUB27 — Cron Jobs para Edge Functions
-- Ejecutar en Supabase SQL Editor (Dashboard > SQL > New Query)
-- Proyecto: wtogsqxvyfeibnfxfbev
-- Fecha: 30/Mar/2026
-- ============================================================
-- NOTA: Reemplazar [SERVICE_ROLE_KEY] con el service_role key
-- que se encuentra en: Dashboard > Settings > API > service_role key
-- ============================================================

-- 1. Habilitar extensiones necesarias (si no están habilitadas)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================
-- CRON JOBS EXISTENTES (verificar si ya existen antes de crear)
-- ============================================================

-- GPS Worker: cada 10 minutos
SELECT cron.schedule(
  'gps-worker',
  '*/10 * * * *',
  $$SELECT net.http_post(
    url:='https://wtogsqxvyfeibnfxfbev.supabase.co/functions/v1/gps-worker',
    headers:='{"Authorization": "Bearer [SERVICE_ROLE_KEY]"}'::jsonb
  )$$
);

-- Resumen 8AM: lunes a viernes 8AM CST (14:00 UTC)
SELECT cron.schedule(
  'resumen-8am',
  '0 14 * * 1-5',
  $$SELECT net.http_post(
    url:='https://wtogsqxvyfeibnfxfbev.supabase.co/functions/v1/resumen-8am',
    headers:='{"Authorization": "Bearer [SERVICE_ROLE_KEY]"}'::jsonb
  )$$
);

-- Motor de alertas: cada hora
SELECT cron.schedule(
  'alerta-engine',
  '0 * * * *',
  $$SELECT net.http_post(
    url:='https://wtogsqxvyfeibnfxfbev.supabase.co/functions/v1/alerta-engine',
    headers:='{"Authorization": "Bearer [SERVICE_ROLE_KEY]"}'::jsonb
  )$$
);

-- ============================================================
-- NUEVOS CRON JOBS (sesión 48 — 30/Mar/2026)
-- ============================================================

-- Felicitaciones cumpleaños: diario 7AM CST (13:00 UTC)
SELECT cron.schedule(
  'felicitaciones-cumpleanos',
  '0 13 * * *',
  $$SELECT net.http_post(
    url:='https://wtogsqxvyfeibnfxfbev.supabase.co/functions/v1/felicitaciones-cumpleanos',
    headers:='{"Authorization": "Bearer [SERVICE_ROLE_KEY]"}'::jsonb
  )$$
);

-- Anti-acaparamiento: diario 7AM CST (13:00 UTC)
SELECT cron.schedule(
  'anti-acaparamiento',
  '0 13 * * *',
  $$SELECT net.http_post(
    url:='https://wtogsqxvyfeibnfxfbev.supabase.co/functions/v1/anti-acaparamiento',
    headers:='{"Authorization": "Bearer [SERVICE_ROLE_KEY]"}'::jsonb
  )$$
);

-- Estadísticas cumplimiento SEMANAL: lunes 8AM CST (14:00 UTC)
SELECT cron.schedule(
  'estadisticas-cumplimiento-semanal',
  '0 14 * * 1',
  $$SELECT net.http_post(
    url:='https://wtogsqxvyfeibnfxfbev.supabase.co/functions/v1/estadisticas-cumplimiento',
    body:='{"tipo":"semanal"}'::jsonb,
    headers:='{"Authorization": "Bearer [SERVICE_ROLE_KEY]", "Content-Type": "application/json"}'::jsonb
  )$$
);

-- Estadísticas cumplimiento MENSUAL: día 1 de cada mes 8AM CST (14:00 UTC)
SELECT cron.schedule(
  'estadisticas-cumplimiento-mensual',
  '0 14 1 * *',
  $$SELECT net.http_post(
    url:='https://wtogsqxvyfeibnfxfbev.supabase.co/functions/v1/estadisticas-cumplimiento',
    body:='{"tipo":"mensual"}'::jsonb,
    headers:='{"Authorization": "Bearer [SERVICE_ROLE_KEY]", "Content-Type": "application/json"}'::jsonb
  )$$
);

-- Disciplina cierre: L-V 6PM CST (00:00 UTC día siguiente = martes a sábado)
SELECT cron.schedule(
  'disciplina-cierre',
  '0 0 * * 2-6',
  $$SELECT net.http_post(
    url:='https://wtogsqxvyfeibnfxfbev.supabase.co/functions/v1/disciplina-cierre',
    headers:='{"Authorization": "Bearer [SERVICE_ROLE_KEY]"}'::jsonb
  )$$
);

-- Briefing diario: diario 7AM CST (13:00 UTC)
SELECT cron.schedule(
  'briefing-diario',
  '0 13 * * *',
  $$SELECT net.http_post(
    url:='https://wtogsqxvyfeibnfxfbev.supabase.co/functions/v1/briefing-diario',
    headers:='{"Authorization": "Bearer [SERVICE_ROLE_KEY]"}'::jsonb
  )$$
);

-- ============================================================
-- VERIFICAR: listar todos los cron jobs activos
-- ============================================================
-- SELECT * FROM cron.job ORDER BY jobname;
