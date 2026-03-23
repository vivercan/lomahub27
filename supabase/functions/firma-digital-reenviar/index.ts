// Edge Function: firma-digital-reenviar
// Reenvía notificación de firma digital pendiente al cliente
// Verifica que no esté vencida ni ya firmada

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
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [to], subject, html: body }),
    })
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { firma_id } = body

    if (!firma_id) {
      return new Response(
        JSON.stringify({ error: 'firma_id requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Leer firma existente
    const firmas = await sbSelect('cotizacion_firmas', `select=*&id=eq.${firma_id}&limit=1`) as Record<string, unknown>[]
    if (!firmas?.length) {
      return new Response(
        JSON.stringify({ error: 'Firma no encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const firma = firmas[0]

    // Validar estado
    if (firma.estado === 'firmada') {
      return new Response(
        JSON.stringify({ error: 'Esta cotización ya fue firmada', firmada_at: firma.firmada_at }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (firma.estado === 'rechazada') {
      return new Response(
        JSON.stringify({ error: 'Esta cotización fue rechazada por el cliente' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar vencimiento
    const venceAt = new Date(firma.vence_at as string)
    if (venceAt < new Date()) {
      // Extender vencimiento 7 días más
      const nuevaVigencia = new Date()
      nuevaVigencia.setDate(nuevaVigencia.getDate() + 7)

      await sbUpdate('cotizacion_firmas', firma_id, {
        estado: 'enviada',
        vence_at: nuevaVigencia.toISOString(),
        reenvios: ((firma.reenvios as number) || 0) + 1,
        ultimo_reenvio_at: new Date().toISOString(),
      })

      firma.vence_at = nuevaVigencia.toISOString()
    } else {
      // Solo registrar reenvío
      await sbUpdate('cotizacion_firmas', firma_id, {
        reenvios: ((firma.reenvios as number) || 0) + 1,
        ultimo_reenvio_at: new Date().toISOString(),
      })
    }

    const firmaLink = `https://v2.jjcrm27.com/firma/${firma.token_firma}`
    const vencimiento = new Date(firma.vence_at as string)
    const reenvioNum = ((firma.reenvios as number) || 0) + 1

    // Reenviar email
    if (firma.cliente_email) {
      await enviarEmail(
        firma.cliente_email as string,
        `Recordatorio: Cotización pendiente de firma — Grupo Loma / TROB`,
        `<div style="font-family: Montserrat, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1E66F5;">Recordatorio — Cotización Pendiente de Firma</h2>
          <p>Estimado(a) <strong>${firma.cliente_nombre || 'Cliente'}</strong>,</p>
          <p>Le recordamos que tiene una cotización de servicio de transporte de carga pendiente de firma digital.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${firmaLink}" style="background-color: #1E66F5; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Revisar y Firmar Cotización</a>
          </p>
          <p style="font-size: 12px; color: #6B7280;">Vigencia: ${vencimiento.toLocaleDateString('es-MX')}. Recordatorio #${reenvioNum}.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 11px; color: #9CA3AF;">Grupo Loma / TROB — Transporte de Carga</p>
        </div>`
      )
    }

    // Reenviar WhatsApp
    if (firma.cliente_telefono) {
      await enviarWhatsApp(
        firma.cliente_telefono as string,
        `Estimado(a) ${firma.cliente_nombre || 'Cliente'}, le recordamos que tiene una cotización pendiente de firma digital. ` +
        `Puede firmarla aquí: ${firmaLink}\n` +
        `Vigencia: ${vencimiento.toLocaleDateString('es-MX')}. Grupo Loma / TROB.`
      )
    }

    return new Response(
      JSON.stringify({
        ok: true,
        firma_id,
        reenvio_numero: reenvioNum,
        link: firmaLink,
        vence: vencimiento.toISOString(),
        notificaciones: {
          email: !!(firma.cliente_email),
          whatsapp: !!(firma.cliente_telefono),
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Error interno', detalle: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
