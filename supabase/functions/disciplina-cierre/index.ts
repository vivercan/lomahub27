// disciplina-cierre — Alerta si CS no tuvo interaccion con clientes
// Cron diario 6PM CST (lun-vie). Detecta CS sin actividad, alerta supervisor
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''

Deno.serve(async (_req) => {
  try {
    const hoy = new Date()
    const dia = hoy.getDay()
    if (dia === 0 || dia === 6) {
      return new Response(JSON.stringify({ ok: true, mensaje: 'Fin de semana', evaluados: 0 }),
        { headers: { 'Content-Type': 'application/json' } })
    }

    const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString()

    const { data: equipoCS } = await supabase
      .from('usuarios_autorizados').select('email, nombre, rol').in('rol', ['cs', 'supervisor_cs'])

    if (!equipoCS?.length) {
      return new Response(JSON.stringify({ ok: true, mensaje: 'No hay CS configurados', evaluados: 0 }),
        { headers: { 'Content-Type': 'application/json' } })
    }

    const csEmails = equipoCS.map(u => u.email)

    const { data: leadsHoy } = await supabase
      .from('leads').select('ejecutivo_email, updated_at')
      .in('ejecutivo_email', csEmails).gte('updated_at', inicioDia)

    const { data: viajesHoy } = await supabase
      .from('viajes').select('ejecutivo_email, updated_at')
      .in('ejecutivo_email', csEmails).gte('updated_at', inicioDia)

    const act: Record<string, { leads: number; viajes: number; total: number }> = {}
    for (const e of csEmails) act[e] = { leads: 0, viajes: 0, total: 0 }

    for (const l of (leadsHoy || [])) {
      if (l.ejecutivo_email && act[l.ejecutivo_email]) { act[l.ejecutivo_email].leads++; act[l.ejecutivo_email].total++ }
    }
    for (const v of (viajesHoy || [])) {
      if (v.ejecutivo_email && act[v.ejecutivo_email]) { act[v.ejecutivo_email].viajes++; act[v.ejecutivo_email].total++ }
    }

    const sinAct = equipoCS.filter(u => (act[u.email]?.total || 0) === 0)
      .map(u => ({ email: u.email, nombre: u.nombre, rol: u.rol }))

    const conAct = equipoCS.filter(u => (act[u.email]?.total || 0) > 0)
      .map(u => ({ email: u.email, nombre: u.nombre, actividad: act[u.email] }))

    if (sinAct.length > 0 && RESEND_API_KEY) {
      const { data: sups } = await supabase
        .from('usuarios_autorizados').select('email').in('rol', ['admin', 'superadmin', 'supervisor_cs'])

      if (sups?.length) {
        const fecha = hoy.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
        const sinHTML = sinAct.map(u =>
          `<tr style="background:#FEF2F2"><td style="padding:6px 12px">${u.nombre}</td><td style="padding:6px 12px">${u.email}</td><td style="padding:6px 12px;color:#EF4444;font-weight:bold">0</td></tr>`
        ).join('')
        const conHTML = conAct.map(u =>
          `<tr><td style="padding:6px 12px">${u.nombre}</td><td style="padding:6px 12px">${u.email}</td><td style="padding:6px 12px;color:#10B981">${u.actividad.total} (${u.actividad.leads}L+${u.actividad.viajes}V)</td></tr>`
        ).join('')

        const resEmail = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'LomaHUB27 <alertas@trob.com.mx>',
            to: sups.map(s => s.email),
            subject: `Disciplina cierre: ${sinAct.length} CS sin actividad - ${fecha}`,
            html: `<h2>Disciplina de cierre - ${fecha}</h2><h3 style="color:#EF4444">Sin actividad (${sinAct.length})</h3><table style="border-collapse:collapse;width:100%"><tr style="background:#0B1220;color:white"><th style="padding:8px 12px;text-align:left">Nombre</th><th style="padding:8px 12px;text-align:left">Email</th><th style="padding:8px 12px;text-align:left">Actividad</th></tr>${sinHTML}</table>${conAct.length > 0 ? `<h3 style="color:#10B981;margin-top:20px">Con actividad (${conAct.length})</h3><table style="border-collapse:collapse;width:100%"><tr style="background:#0B1220;color:white"><th style="padding:8px 12px;text-align:left">Nombre</th><th style="padding:8px 12px;text-align:left">Email</th><th style="padding:8px 12px;text-align:left">Actividad</th></tr>${conHTML}</table>` : ''}<p style="color:#666;font-size:13px;margin-top:16px">Generado por LomaHUB27 6PM CST</p>`,
          }),
        })
        if (!resEmail.ok) {
          const errBody = await resEmail.text()
          console.error('disciplina-cierre Resend error:', resEmail.status, errBody)
        }
      }
    }

    await supabase.from('logs_sistema').insert({
      tipo: 'disciplina_cierre',
      detalle: { fecha: hoy.toISOString(), evaluados: equipoCS.length, sin_actividad: sinAct.length, con_actividad: conAct.length },
    }).then(() => {}).catch(() => {})

    return new Response(JSON.stringify({
      ok: true, fecha: hoy.toISOString().split('T')[0],
      evaluados: equipoCS.length, sin_actividad: sinAct.length, con_actividad: conAct.length,
      detalle_sin: sinAct, detalle_con: conAct,
    }), { headers: { 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('disciplina-cierre:', err)
    return new Response(JSON.stringify({
      ok: false, mensaje: err instanceof Error ? err.message : 'Error interno',
    }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
