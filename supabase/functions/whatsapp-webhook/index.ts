// WhatsApp Webhook — Recibe mensajes de WhatsApp Business API
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const WA_TOKEN = Deno.env.get('WHATSAPP_API_TOKEN')!
const WA_PHONE_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')!
const VERIFY_TOKEN = Deno.env.get('WHATSAPP_WEBHOOK_VERIFY_TOKEN')!

Deno.serve(async (req) => {
  // Verificación del webhook (GET de Meta)
  if (req.method === 'GET') {
    const url = new URL(req.url)
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return new Response(challenge, { status: 200 })
    }
    return new Response('Forbidden', { status: 403 })
  }

  const body = await req.json()
  const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
  if (!message) return new Response('OK', { status: 200 })

  const numeroOrigen = message.from
  const texto = message.text?.body || ''

  await supabase.from('whatsapp_mensajes').insert({
    numero_origen: numeroOrigen,
    direccion: 'entrante',
    contenido: texto,
    timestamp: new Date().toISOString()
  })

  const { data: autorizado } = await supabase
    .from('whatsapp_numeros_autorizados')
    .select('cliente_id, nombre_contacto')
    .eq('numero', numeroOrigen)
    .eq('activo', true)
    .single()

  if (!autorizado) {
    await enviarMensaje(numeroOrigen, 'Este número no está habilitado para consultas. Contacta a tu ejecutivo de cuenta.')
    return new Response('OK', { status: 200 })
  }

  const textoLower = texto.toLowerCase()

  if (textoLower.includes('estatus') || textoLower.includes('status') || textoLower.match(/\d{4,}/)) {
    const economicoMatch = texto.match(/\d{4,}/)
    if (economicoMatch) {
      await responderEstatus(numeroOrigen, economicoMatch[0])
    } else {
      await enviarMensaje(numeroOrigen, 'Para consultar el estatus de tu carga, envía el número económico. Ejemplo: "estatus 8451"')
    }
  } else if (textoLower.includes('supervisor') || textoLower.includes('humano') || textoLower.includes('ejecutivo')) {
    await supabase.from('whatsapp_mensajes').insert({
      numero_origen: numeroOrigen,
      cliente_id: autorizado.cliente_id,
      direccion: 'entrante',
      contenido: `[ESCALAMIENTO] ${texto}`,
      tipo: 'escalamiento'
    })
    await enviarMensaje(numeroOrigen, 'Entendido. Te conectaré con un ejecutivo en breve.')
  } else {
    await enviarMensaje(numeroOrigen, `Hola ${autorizado.nombre_contacto}! Puedes consultar:\n• Estatus de carga: envía el número económico\n• Hablar con ejecutivo: escribe "ejecutivo"`)
  }

  return new Response('OK', { status: 200 })
})

async function responderEstatus(numero: string, economico: string) {
  const { data: gps } = await supabase
    .from('gps_tracking')
    .select('*')
    .eq('economico', economico)
    .single()

  if (!gps) {
    await enviarMensaje(numero, `No encontré la unidad ${economico}. Verifica el número.`)
    return
  }

  const msg = `• Unidad: ${economico}\n• Ubicación: ${gps.ubicacion || gps.municipio_geo}\n• Velocidad: ${gps.velocidad} km/h\n• Estado: ${gps.estatus}\n• Actualizado: ${new Date(gps.ultima_actualizacion).toLocaleTimeString('es-MX')}`
  await enviarMensaje(numero, msg)
}

async function enviarMensaje(to: string, body: string) {
  await fetch(`https://graph.facebook.com/v18.0/${WA_PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WA_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body }
    })
  })

  await supabase.from('whatsapp_mensajes').insert({
    numero_origen: to,
    direccion: 'saliente',
    contenido: body
  })
}
