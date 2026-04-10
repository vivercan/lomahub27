// Edge Function: firma-digital-enviar
// Envía cotización para firma digital al cliente
// Genera hash SHA-256, link único, y notifica por email + WhatsApp

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

// Generar hash SHA-256
async function generarHash(contenido: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(contenido)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Generar token único para link de firma
function generarToken(): string {
  const arr = new Uint8Array(32)
  crypto.getRandomValues(arr)
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')
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
      console.error('firma-digital-enviar Resend error:', resEmail.status, errBody)
    }
    console.log(`[EMAIL SENT] To: ${to}`)
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
    const { cotizacion_id, cliente_email, cliente_telefono, cliente_nombre, enviado_por } = body

    if (!cotizacion_id) {
      return new Response(
        JSON.stringify({ error: 'cotizacion_id requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Leer cotización
    const cotizaciones = await sbSelect('cotizaciones', `select=*&id=eq.${cotizacion_id}&limit=1`) as Record<string, unknown>[]
    if (!cotizaciones?.length) {
      return new Response(
        JSON.stringify({ error: 'Cotización no encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const cotizacion = cotizaciones[0]

    // Generar hash del contenido de la cotización
    const contenidoHash = JSON.stringify({
      id: cotizacion.id,
      cliente_id: cotizacion.cliente_id,
      monto_total: cotizacion.monto_total,
      moneda: cotizacion.moneda,
      rutas: cotizacion.rutas || [],
      created_at: cotizacion.created_at,
    })
    const hashDocumento = await generarHash(contenidoHash)

    // Generar token único
    const token = generarToken()

    // Calcular fecha de vencimiento (7 días)
    const vencimiento = new Date()
    vencimiento.setDate(vencimiento.getDate() + 7)

    // Crear registro de firma
    const firma = await sbInsert('cotizacion_firmas', {
      cotizacion_id,
      cliente_nombre: cliente_nombre || (cotizacion.cliente_nombre as string) || 'Cliente',
      cliente_email: cliente_email || null,
      cliente_telefono: cliente_telefono || null,
      estado: 'enviada',
      hash_documento: hashDocumento,
      token_firma: token,
      enviado_por: enviado_por || null,
      enviado_at: new Date().toISOString(),
      vence_at: vencimiento.toISOString(),
    })

    const firmaId = (firma as Record<string, unknown>[])?.[0]?.id || 'N/A'
    const firmaLink = `https://v2.jjcrm27.com/firma/${token}`

    // Enviar email con link de firma
    if (cliente_email) {
      const monto = cotizacion.monto_total || 'N/A'
      const moneda = cotizacion.moneda || 'MXN'

      await enviarEmail(
        cliente_email,
        `Cotización lista para firma — Grupo Loma / TROB`,
        `<div style="font-family: Montserrat, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1E66F5;">Cotización de Servicio de Transporte</h2>
          <p>Estimado(a) <strong>${cliente_nombre || 'Cliente'}</strong>,</p>
          <p>Le hacemos llegar su cotización de servicio de transporte de carga para su revisión y firma digital.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Cotización:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${cotizacion.folio || cotizacion_id.substring(0, 8)}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Monto Total:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">$${Number(monto).toLocaleString()} ${moneda}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Vigencia:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${vencimiento.toLocaleDateString('es-MX')}</td></tr>
          </table>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${firmaLink}" style="background-color: #1E66F5; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Revisar y Firmar Cotización</a>
          </p>
          <p style="font-size: 12px; color: #6B7280;">Hash de integridad: ${hashDocumento.substring(0, 16)}...</p>
          <p style="font-size: 12px; color: #6B7280;">Este enlace vence el ${vencimiento.toLocaleDateString('es-MX')}. Si tiene dudas, contacte a su ejecutivo.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 11px; color: #9CA3AF;">Grupo Loma / TROB — Transporte de Carga</p>
        </div>`
      )
    }

    // Enviar WhatsApp
    if (cliente_telefono) {
      await enviarWhatsApp(
        cliente_telefono,
        `Estimado(a) ${cliente_nombre || 'Cliente'}, le enviamos su cotización de transporte de carga para firma digital. ` +
        `Puede revisarla y firmarla en: ${firmaLink}\n` +
        `Vigencia: ${vencimiento.toLocaleDateString('es-MX')}. Grupo Loma / TROB.`
      )
    }

    return new Response(
      JSON.stringify({
        ok: true,
        firma_id: firmaId,
        token,
        link: firmaLink,
        hash: hashDocumento,
        vence: vencimiento.toISOString(),
        notificaciones: {
          email: !!cliente_email,
          whatsapp: !!cliente_telefono,
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
