// estadisticas-cumplimiento — KPIs de cumplimiento a clientes (semanal/mensual)
// Cron: semanal lunes 8AM + mensual dia 1 8AM
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''

Deno.serve(async (_req) => {
  try {
    const hoy = new Date()
    const esMensual = hoy.getDate() === 1
    const periodo = esMensual ? 'mensual' : 'semanal'

    let fechaInicio: Date
    if (esMensual) {
      fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
    } else {
      fechaInicio = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    const { data: viajes } = await supabase
      .from('viajes')
      .select('id, cliente_id, estado, fecha_salida, fecha_llegada_estimada, fecha_llegada_real, tipo')
      .gte('fecha_salida', fechaInicio.toISOString())
      .lte('fecha_salida', hoy.toISOString())

    const { data: clientes } = await supabase
      .from('clientes')
      .select('id, razon_social, contacto_nombre, contacto_email')
      .eq('tipo', 'activo').not('contacto_email', 'is', null)

    const clienteMap = new Map((clientes || []).map(c => [c.id, c]))

    interface ClienteKPI { total: number; completados: number; enTiempo: number; cumplimiento: number; onTime: number }
    const kpis: Record<string, ClienteKPI> = {}

    for (const v of (viajes || [])) {
      if (!v.cliente_id) continue
      if (!kpis[v.cliente_id]) kpis[v.cliente_id] = { total: 0, completados: 0, enTiempo: 0, cumplimiento: 0, onTime: 0 }
      const k = kpis[v.cliente_id]
      k.total++
      if (v.estado === 'completado' || v.estado === 'entregado') {
        k.completados++
        if (v.fecha_llegada_real && v.fecha_llegada_estimada) {
          if (new Date(v.fecha_llegada_real) <= new Date(v.fecha_llegada_estimada)) k.enTiempo++
        } else { k.enTiempo++ }
      }
    }

    for (const k of Object.values(kpis)) {
      k.cumplimiento = k.total > 0 ? Math.round((k.completados / k.total) * 100) : 0
      k.onTime = k.completados > 0 ? Math.round((k.enTiempo / k.completados) * 100) : 0
    }

    const enviados: string[] = []
    const errores: string[] = []

    for (const [clienteId, kpi] of Object.entries(kpis)) {
      const cliente = clienteMap.get(clienteId)
      if (!cliente?.contacto_email || kpi.total === 0) continue
      try {
        if (RESEND_API_KEY) {
          const resEmail = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': \`Bearer \${RESEND_API_KEY}\`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: 'LomaHUB27 <reportes@trob.com.mx>',
              to: [cliente.contacto_email],
              subject: \`Reporte de cumplimiento \${periodo} - \${cliente.razon_social}\`,
              html: \`<div style="font-family:Montserrat,sans-serif;max-width:600px;margin:0 auto;padding:30px"><h2>Reporte de Cumplimiento</h2><p>Estimado(a) \${cliente.contacto_nombre || 'Cliente'},</p><table style="width:100%;border-collapse:collapse;margin:20px 0"><tr style="background:#0B1220;color:white"><th style="padding:10px;text-align:left">KPI</th><th style="padding:10px;text-align:right">Valor</th></tr><tr><td style="padding:8px;border-bottom:1px solid #eee">Viajes totales</td><td style="padding:8px;text-align:right">\${kpi.total}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee">Completados</td><td style="padding:8px;text-align:right">\${kpi.completados}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee">Cumplimiento</td><td style="padding:8px;text-align:right">\${kpi.cumplimiento}%</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee">On-time</td><td style="padding:8px;text-align:right">\${kpi.onTime}%</td></tr></table><p style="color:#666;font-size:13px">Generado por LomaHUB27</p></div>\`,
            }),
          })
          if (!resEmail.ok) {
            const errBody = await resEmail.text()
            console.error('estadisticas-cumplimiento Resend error:', resEmail.status, errBody)
          }
        }
        enviados.push(cliente.razon_social)
      } catch (e) {
    console.error('estadisticas-cumplimiento:', e)
        errores.push(\`\${cliente.razon_social}: \${e instanceof Error ? e.message : 'Error'}\`)
      }
    }

    return new Response(JSON.stringify({
      ok: true, periodo, clientes_con_viajes: Object.keys(kpis).length,
      enviados: enviados.length, errores: errores.length,
    }), { headers: { 'Content-Type': 'application/json' } })

  } catch (err) {
    return new Response(JSON.stringify({
      ok: false, mensaje: err instanceof Error ? err.message : 'Error interno',
    }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
