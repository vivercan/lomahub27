// Edge Function: comunicacion-proactiva
// Envía alertas proactivas al cliente antes de la cita de descarga
// Niveles: sin_riesgo (todo OK), riesgo_leve (posible retraso),
//          riesgo_alto (retraso probable), retraso (ya pasó la cita)
// Canales: WhatsApp + Email

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const sbHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
}

async function sbSelect(table: string, query: string): Promise<unknown[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: sbHeaders })
  return await res.json()
}

async function sbInsert(table: string, data: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...sbHeaders, Prefer: 'return=representation' },
    body: JSON.stringify(data),
  })
  return await res.json()
}

async function sbUpdate(table: string, id: string, data: Record<string, unknown>): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...sbHeaders, Prefer: 'return=minimal' },
    body: JSON.stringify(data),
  })
}

async function enviarEmail(to: string, subject: string, body: string): Promise<void> {
  try {
    const RESEND_KEY = Deno.env.get('RESEND_API_KEY')
    const FROM = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@mail.jjcrm27.com'
    if (!RESEND_KEY) { console.log(`[EMAIL SKIP] No RESEND_API_KEY`); return }
    const resEmail = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [to], subject, html: body }),
    })
    if (!resEmail.ok) {
      const errBody = await resEmail.text()
      console.error('comunicacion-proactiva Resend error:', resEmail.status, errBody)
    }
  } catch (err) { console.error(`[EMAIL ERROR] ${err}`) }
}

async function enviarWhatsApp(telefono: string, mensaje: string): Promise<void> {
  try {
    const WA_TOKEN = Deno.env.get('WHATSAPP_API_TOKEN')
    const WA_PHONE_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
    if (!WA_TOKEN || !WA_PHONE_ID || !telefono) return
    const tel = telefono.replace(/[^\d]/g, '')
    await fetch(`https://graph.facebook.com/v18.0/${WA_PHONE_ID}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: tel, type: 'text', text: { body: mensaje } }),
    })
  } catch (err) { console.error(`[WA ERROR] ${err}`) }
}

type NivelRiesgo = 'sin_riesgo' | 'riesgo_leve' | 'riesgo_alto' | 'retraso'

function calcularNivelRiesgo(etaMinutos: number, citaMinutos: number): NivelRiesgo {
  const diferencia = etaMinutos - citaMinutos // positivo = llega tarde
  if (diferencia > 0) return 'retraso'
  if (diferencia > -30) return 'riesgo_alto'    // menos de 30 min de margen
  if (diferencia > -60) return 'riesgo_leve'    // menos de 60 min de margen
  return 'sin_riesgo'
}

function mensajeCliente(nivel: NivelRiesgo, folio: string, eta: string, cita: string, cliente: string): string {
  switch (nivel) {
    case 'sin_riesgo':
      return `Estimado(a) ${cliente}, su entrega ${folio} va en camino y llegará puntual a su cita de ${cita}. ETA estimado: ${eta}. Grupo Loma / TROB.`
    case 'riesgo_leve':
      return `Estimado(a) ${cliente}, su entrega ${folio} podría presentar un ligero retraso. ETA: ${eta}, Cita: ${cita}. Estamos monitoreando. Grupo Loma / TROB.`
    case 'riesgo_alto':
      return `Estimado(a) ${cliente}, su entrega ${folio} presenta un posible retraso significativo. ETA: ${eta}, Cita: ${cita}. Nuestro equipo trabaja para minimizar el impacto. Le mantendremos informado. Grupo Loma / TROB.`
    case 'retraso':
      return `Estimado(a) ${cliente}, lamentamos informarle que su entrega ${folio} presenta retraso. ETA actualizado: ${eta} (cita original: ${cita}). Un ejecutivo le contactará para coordinar. Grupo Loma / TROB.`
  }
}

function asuntoEmail(nivel: NivelRiesgo, folio: string): string {
  switch (nivel) {
    case 'sin_riesgo': return `✅ Entrega ${folio} — En camino, llegada puntual`
    case 'riesgo_leve': return `⚠️ Entrega ${folio} — Posible retraso menor`
    case 'riesgo_alto': return `🔶 Entrega ${folio} — Retraso probable`
    case 'retraso': return `🔴 Entrega ${folio} — Retraso confirmado`
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { accion } = body

    // Acción: evaluar un viaje específico
    if (accion === 'evaluar_viaje') {
      const { viaje_id } = body
      if (!viaje_id) {
        return new Response(JSON.stringify({ error: 'viaje_id requerido' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      const viajes = await sbSelect('viajes', `select=*&id=eq.${viaje_id}&limit=1`) as Record<string, unknown>[]
      if (!viajes?.length) {
        return new Response(JSON.stringify({ error: 'Viaje no encontrado' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      const viaje = viajes[0]
      if (!viaje.eta_calculado || !viaje.cita_descarga) {
        return new Response(JSON.stringify({ error: 'Viaje sin ETA o cita de descarga' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      const etaTime = new Date(viaje.eta_calculado as string).getTime() / 60000
      const citaTime = new Date(viaje.cita_descarga as string).getTime() / 60000
      const nivel = calcularNivelRiesgo(etaTime, citaTime)

      // Obtener datos del cliente
      let clienteNombre = 'Cliente'
      let clienteEmail = ''
      let clienteTel = ''
      if (viaje.cliente_id) {
        const clientes = await sbSelect('clientes', `select=razon_social,email,telefono&id=eq.${viaje.cliente_id}&limit=1`) as Record<string, unknown>[]
        if (clientes?.length) {
          clienteNombre = (clientes[0].razon_social as string) || 'Cliente'
          clienteEmail = (clientes[0].email as string) || ''
          clienteTel = (clientes[0].telefono as string) || ''
        }
      }

      const folio = (viaje.folio as string) || viaje_id.substring(0, 8)
      const etaStr = new Date(viaje.eta_calculado as string).toLocaleString('es-MX', { timeZone: 'America/Monterrey' })
      const citaStr = new Date(viaje.cita_descarga as string).toLocaleString('es-MX', { timeZone: 'America/Monterrey' })

      const mensaje = mensajeCliente(nivel, folio, etaStr, citaStr, clienteNombre)

      // Registrar alerta
      await sbInsert('alertas_proactivas', {
        viaje_id,
        cliente_id: viaje.cliente_id || null,
        nivel_riesgo: nivel,
        mensaje,
        canal_whatsapp: !!clienteTel,
        canal_email: !!clienteEmail,
        enviado: false,
      })

      // Enviar si nivel requiere notificación
      const enviar = nivel !== 'sin_riesgo' || body.forzar_envio
      if (enviar) {
        if (clienteTel) await enviarWhatsApp(clienteTel, mensaje)
        if (clienteEmail) {
          await enviarEmail(clienteEmail, asuntoEmail(nivel, folio),
            `<div style="font-family: Montserrat, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <p>${mensaje}</p>
              <p style="font-size: 12px; color: #6B7280; margin-top: 20px;">Folio: ${folio} | ETA: ${etaStr} | Cita: ${citaStr}</p>
            </div>`)
        }

        // Marcar como enviado
        const alertas = await sbSelect('alertas_proactivas', `select=id&viaje_id=eq.${viaje_id}&order=created_at.desc&limit=1`) as Record<string, unknown>[]
        if (alertas?.length) {
          await sbUpdate('alertas_proactivas', alertas[0].id as string, { enviado: true, enviado_at: new Date().toISOString() })
        }
      }

      return new Response(
        JSON.stringify({
          ok: true,
          viaje_id,
          folio,
          nivel,
          cliente: clienteNombre,
          eta: etaStr,
          cita: citaStr,
          enviado: enviar,
          canales: { whatsapp: !!clienteTel && enviar, email: !!clienteEmail && enviar },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Acción: scan automático de TODOS los viajes activos
    if (accion === 'scan_todos') {
      const viajes = await sbSelect(
        'viajes',
        'select=id,folio,eta_calculado,cita_descarga,cliente_id&estado=in.(en_transito,en_riesgo)&eta_calculado=not.is.null&cita_descarga=not.is.null'
      ) as Record<string, unknown>[]

      let alertasEnviadas = 0
      let viajesEvaluados = 0
      const resumen: { folio: string; nivel: string; enviado: boolean }[] = []

      for (const viaje of viajes || []) {
        viajesEvaluados++
        const etaTime = new Date(viaje.eta_calculado as string).getTime() / 60000
        const citaTime = new Date(viaje.cita_descarga as string).getTime() / 60000
        const nivel = calcularNivelRiesgo(etaTime, citaTime)

        if (nivel === 'sin_riesgo') {
          resumen.push({ folio: (viaje.folio as string) || '', nivel, enviado: false })
          continue
        }

        // Verificar si ya se envió alerta reciente (últimas 2 horas) para evitar spam
        const hace2h = new Date(Date.now() - 2 * 3600000).toISOString()
        const alertasRecientes = await sbSelect(
          'alertas_proactivas',
          `select=id&viaje_id=eq.${viaje.id}&enviado=eq.true&created_at=gte.${hace2h}&limit=1`
        )
        if (alertasRecientes?.length) {
          resumen.push({ folio: (viaje.folio as string) || '', nivel, enviado: false })
          continue
        }

        // Obtener cliente
        let clienteNombre = 'Cliente'
        let clienteEmail = ''
        let clienteTel = ''
        if (viaje.cliente_id) {
          const clientes = await sbSelect('clientes', `select=razon_social,email,telefono&id=eq.${viaje.cliente_id}&limit=1`) as Record<string, unknown>[]
          if (clientes?.length) {
            clienteNombre = (clientes[0].razon_social as string) || 'Cliente'
            clienteEmail = (clientes[0].email as string) || ''
            clienteTel = (clientes[0].telefono as string) || ''
          }
        }

        const folio = (viaje.folio as string) || (viaje.id as string).substring(0, 8)
        const etaStr = new Date(viaje.eta_calculado as string).toLocaleString('es-MX', { timeZone: 'America/Monterrey' })
        const citaStr = new Date(viaje.cita_descarga as string).toLocaleString('es-MX', { timeZone: 'America/Monterrey' })
        const mensaje = mensajeCliente(nivel, folio, etaStr, citaStr, clienteNombre)

        // Registrar y enviar
        await sbInsert('alertas_proactivas', {
          viaje_id: viaje.id,
          cliente_id: viaje.cliente_id || null,
          nivel_riesgo: nivel,
          mensaje,
          canal_whatsapp: !!clienteTel,
          canal_email: !!clienteEmail,
          enviado: true,
          enviado_at: new Date().toISOString(),
        })

        if (clienteTel) await enviarWhatsApp(clienteTel, mensaje)
        if (clienteEmail) await enviarEmail(clienteEmail, asuntoEmail(nivel, folio),
          `<div style="font-family: Montserrat, Arial, sans-serif; padding: 20px;"><p>${mensaje}</p></div>`)

        alertasEnviadas++
        resumen.push({ folio, nivel, enviado: true })
      }

      // Notificar CS si hay alertas
      if (alertasEnviadas > 0) {
        await enviarEmail(
          'cs@trob.com.mx',
          `📡 Comunicación Proactiva — ${alertasEnviadas} alertas enviadas`,
          `<div style="font-family: Montserrat, Arial, sans-serif; padding: 20px;">
            <h3>Resumen de alertas proactivas</h3>
            <p>Se evaluaron ${viajesEvaluados} viajes activos. Se enviaron ${alertasEnviadas} alertas a clientes.</p>
            <p>Detalle: ${resumen.filter(r => r.enviado).map(r => `${r.folio} (${r.nivel})`).join(', ')}</p>
            <p>Ingresa a v2.jjcrm27.com/servicio/comunicacion-proactiva para más detalle.</p>
          </div>`
        )
      }

      return new Response(
        JSON.stringify({
          ok: true,
          viajes_evaluados: viajesEvaluados,
          alertas_enviadas: alertasEnviadas,
          resumen,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: `Acción no soportada: ${accion}. Use "evaluar_viaje" o "scan_todos"` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Error interno', detalle: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
