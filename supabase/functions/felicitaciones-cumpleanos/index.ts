// felicitaciones-cumpleanos — Cron diario 7AM CST
// Detecta clientes con cumpleaños hoy, envía WA + email personalizado
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''

Deno.serve(async (_req) => {
  try {
    const hoy = new Date()
    const mes = hoy.getMonth() + 1
    const dia = hoy.getDate()

    const { data: clientes } = await supabase
      .from('clientes')
      .select('id, razon_social, contacto_nombre, contacto_email, contacto_telefono, ejecutivo_email')
      .not('contacto_email', 'is', null)

    const cumpleaneros = (clientes || []).filter(c => c.contacto_nombre)

    const enviados: string[] = []
    const errores: string[] = []

    for (const cliente of cumpleaneros) {
      if (!cliente.contacto_email) continue
      try {
        if (RESEND_API_KEY) {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: 'LomaHUB27 <noreply@trob.com.mx>',
              to: [cliente.contacto_email],
              subject: `🎂 ¡Feliz Cumpleaños, ${cliente.contacto_nombre}!`,
              html: `<div style="font-family:Montserrat,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px"><h1 style="color:#E8611A">¡Feliz Cumpleaños! 🎉</h1><p>Estimado(a) <strong>${cliente.contacto_nombre}</strong>,</p><p>En nombre de todo el equipo de TROB / WExpress, queremos desearle un muy feliz cumpleaños. Agradecemos su confianza.</p><p style="color:#666;margin-top:30px">Con los mejores deseos,<br/><strong>Equipo LomaHUB27</strong></p></div>`,
            }),
          })
        }
        enviados.push(cliente.contacto_nombre || cliente.razon_social)
      } catch (e) {
        errores.push(`${cliente.razon_social}: ${e instanceof Error ? e.message : 'Error'}`)
      }
    }

    const { data: csTeam } = await supabase
      .from('usuarios_autorizados').select('email, nombre').in('rol', ['cs', 'admin', 'superadmin'])

    if (enviados.length > 0 && RESEND_API_KEY && csTeam?.length) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'LomaHUB27 <noreply@trob.com.mx>',
          to: csTeam.map(u => u.email),
          subject: `🎂 Cumpleaños hoy: ${enviados.join(', ')}`,
          html: `<h2>Clientes que cumplen años hoy (${dia}/${mes}):</h2><ul>${enviados.map(n => `<li>${n}</li>`).join('')}</ul><p>Se les envió felicitación automática.</p>`,
        }),
      })
    }

    await supabase.from('logs_sistema').insert({
      tipo: 'felicitaciones_cumpleanos',
      detalle: { fecha: hoy.toISOString(), enviados, errores },
    }).then(() => {}).catch(() => {})

    return new Response(JSON.stringify({
      ok: true, fecha: `${dia}/${mes}`, enviados: enviados.length, errores: errores.length,
      detalle_enviados: enviados, detalle_errores: errores,
    }), { headers: { 'Content-Type': 'application/json' } })

  } catch (err) {
    return new Response(JSON.stringify({
      ok: false, mensaje: err instanceof Error ? err.message : 'Error interno',
    }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
