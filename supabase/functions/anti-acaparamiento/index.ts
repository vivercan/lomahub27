// anti-acaparamiento — Libera leads estancados sin actividad > N dias
// Cron diario 7AM CST. N configurable en parametros_sistema
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''

Deno.serve(async (_req) => {
  try {
    const { data: params } = await supabase
      .from('parametros_sistema').select('clave, valor')
      .in('clave', ['anti_acaparamiento_dias', 'anti_acaparamiento_activo'])

    const config: Record<string, string> = {}
    for (const p of (params || [])) config[p.clave] = p.valor

    const diasMax = parseInt(config.anti_acaparamiento_dias || '7')
    const activo = config.anti_acaparamiento_activo !== 'false'

    if (!activo) {
      return new Response(JSON.stringify({ ok: true, mensaje: 'Anti-acaparamiento desactivado', liberados: 0 }),
        { headers: { 'Content-Type': 'application/json' } })
    }

    const fechaCorte = new Date(Date.now() - diasMax * 24 * 60 * 60 * 1000).toISOString()

    const { data: leadsEstancados } = await supabase
      .from('leads').select('id, empresa, contacto, ejecutivo_email, estado, updated_at')
      .not('ejecutivo_email', 'is', null)
      .not('estado', 'in', '("Cerrado Ganado","Cerrado Perdido")')
      .lt('updated_at', fechaCorte)

    const liberados: Array<{ id: string; empresa: string; ejecutivo_anterior: string; dias: number }> = []

    for (const lead of (leadsEstancados || [])) {
      const dias = Math.floor((Date.now() - new Date(lead.updated_at).getTime()) / 86400000)
      const { error } = await supabase
        .from('leads').update({ ejecutivo_email: null, updated_at: new Date().toISOString() }).eq('id', lead.id)

      if (!error) liberados.push({
        id: lead.id, empresa: lead.empresa || lead.contacto || 'Sin nombre',
        ejecutivo_anterior: lead.ejecutivo_email, dias,
      })
    }

    if (liberados.length > 0 && RESEND_API_KEY) {
      const { data: supervisores } = await supabase
        .from('usuarios_autorizados').select('email').in('rol', ['admin', 'superadmin', 'gerente_comercial'])

      if (supervisores?.length) {
        const rows = liberados.map(l =>
          `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee">${l.empresa}</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${l.ejecutivo_anterior}</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${l.dias}d</td></tr>`
        ).join('')

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'LomaHUB27 <alertas@trob.com.mx>',
            to: supervisores.map(s => s.email),
            subject: `Anti-acaparamiento: ${liberados.length} leads liberados`,
            html: `<h2>Leads liberados por inactividad (>${diasMax} dias)</h2><table style="border-collapse:collapse;width:100%"><tr style="background:#0B1220;color:white"><th style="padding:8px 12px;text-align:left">Lead</th><th style="padding:8px 12px;text-align:left">Ejecutivo</th><th style="padding:8px 12px;text-align:left">Dias</th></tr>${rows}</table><p style="color:#666;font-size:13px">Disponibles para reasignacion.</p>`,
          }),
        })
      }
    }

    await supabase.from('logs_sistema').insert({
      tipo: 'anti_acaparamiento',
      detalle: { dias_max: diasMax, evaluados: leadsEstancados?.length || 0, liberados: liberados.length },
    }).then(() => {}).catch(() => {})

    return new Response(JSON.stringify({
      ok: true, dias_max: diasMax, evaluados: leadsEstancados?.length || 0,
      liberados: liberados.length, detalle: liberados,
    }), { headers: { 'Content-Type': 'application/json' } })

  } catch (err) {
    return new Response(JSON.stringify({
      ok: false, mensaje: err instanceof Error ? err.message : 'Error interno',
    }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
