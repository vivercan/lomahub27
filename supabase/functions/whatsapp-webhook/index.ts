// WhatsApp Webhook â Recibe mensajes de WhatsApp Business API
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const WA_TOKEN = Deno.env.get('WHATSAPP_API_TOKEN')!
const WA_PHONE_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')!
const VERIFY_TOKEN = Deno.env.get('WHATSAPP_WEBHOOK_VERIFY_TOKEN')!

Deno.serve(async (req) => {
  try {
    // Verification of webhook (GET from Meta)
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

    let body
    try {
      body = await req.json()
    } catch (e) {
      console.error('whatsapp-webhook: Invalid JSON in request:', e)
      return new Response('Bad Request', { status: 400 })
    }

    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
    if (!message) return new Response('OK', { status: 200 })

    const numeroOrigen = message.from
    const texto = message.text?.body || ''

    // Log incoming message
    const { error: logError1 } = await supabase.from('whatsapp_mensajes').insert({
      numero_origen: numeroOrigen,
      direccion: 'entrante',
      contenido: texto,
      timestamp: new Date().toISOString()
    })
    if (logError1) console.error('whatsapp-webhook: Failed to log incoming message:', logError1)

    // Check if number is authorized
    const { data: autorizado, error: authError } = await supabase
      .from('whatsapp_numeros_autorizados')
      .select('cliente_id, nombre_contacto')
      .eq('numero', numeroOrigen)
      .eq('activo', true)
      .single()

    if (authError && authError.code !== 'PGRST116') {
      console.error('whatsapp-webhook: Failed to check authorization:', authError)
    }

    if (!autorizado) {
      await enviarMensaje(numeroOrigen, 'Este nÃºmero no estÃ¡ habilitado para consultas. Contacta a tu ejecutivo de cuenta.')
      return new Response('OK', { status: 200 })
    }

    const textoLower = texto.toLowerCase()

    if (textoLower.includes('estatus') || textoLower.includes('status') || textoLower.match(/\d{4,}/)) {
      const economicoMatch = texto.match(/\d{4,}/)
      if (economicoMatch) {
        await responderEstatus(numeroOrigen, economicoMatch[0])
      } else {
        await enviarMensaje(numeroOrigen, 'Para consultar el estatus de tu carga, envÃ­a el nÃºmero econÃ³mico. Ejemplo: "estatus 8451"')
      }
    } else if (textoLower.includes('supervisor') || textoLower.includes('humano') || textoLower.includes('ejecutivo')) {
      const { error: escError } = await supabase.from('whatsapp_mensajes').insert({
        numero_origen: numeroOrigen,
        cliente_id: autorizado.cliente_id,
        direccion: 'entrante',
        contenido: `[ESCALAMIENTO] ${texto}`,
        tipo: 'escalamiento'
      })
      if (escError) console.error('whatsapp-webhook: Failed to log escalamiento:', escError)

      await enviarMensaje(numeroOrigen, 'Entendido. Te conectarÃ© con un ejecutivo en breve.')
    } else {
      await enviarMensaje(numeroOrigen, `Hola ${autorizado.nombre_contacto}! Puedes consultar:\nâ¢ Estatus de carga: envÃ­a el nÃºmero econÃ³mico\nâ¢ Hablar con ejecutivo: escribe "ejecutivo"`)
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('whatsapp-webhook handler error:', error)
    return new Response('ERROR', { status: 500 })
  }
})

async function responderEstatus(numero: string, economico: string) {
  try {
    const { data: gps, error: gpsError } = await supabase
      .from('gps_tracking')
      .select('*')
      .eq('economico', economico)
      .single()

    if (gpsError) {
      console.error(`whatsapp-webhook: Failed to fetch GPS for ${economico}:`, gpsError)
      await enviarMensaje(numero, `Error al consultar estatus de ${economico}. Intenta de nuevo.`)
      return
    }

    if (!gps) {
      await enviarMensaje(numero, `No encontrÃ© la unidad ${economico}. Verifica el nÃºmero.`)
      return
    }

    const ubicacion = gps.ubicacion || gps.municipio_geo || 'UbicaciÃ³n desconocida'
    const velocidad = gps.velocidad ?? 'N/A'
    const estatus = gps.estatus || 'Desconocido'
    const tiempoActualizacion = gps.ultima_actualizacion
      ? new Date(gps.ultima_actualizacion).toLocaleTimeString('es-MX')
      : 'N/A'

    const msg = `â¢ Unidad: ${economico}\nâ¢ UbicaciÃ³n: ${ubicacion}\nâ¢ Velocidad: ${velocidad} km/h\nâ¢ Estado: ${estatus}\nâ¢ Actualizado: ${tiempoActualizacion}`
    await enviarMensaje(numero, msg)
  } catch (error) {
    console.error('whatsapp-webhook responderEstatus error:', error)
    await enviarMensaje(numero, 'Error interno al procesar tu consulta. Intenta mÃ¡s tarde.')
  }
}

async function enviarMensaje(to: string, body: string) {
  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${WA_PHONE_ID}/messages`, {
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

    if (!response.ok) {
      const responseBody = await response.text()
      console.error(`whatsapp-webhook: WhatsApp send failed for ${to}: ${response.status} â ${responseBody}`)
    }

    // Log outgoing message
    const { error: logError } = await supabase.from('whatsapp_mensajes').insert({
      numero_origen: to,
      direccion: 'saliente',
      contenido: body,
      timestamp: new Date().toISOString()
    })
    if (logError) console.error('whatsapp-webhook: Failed to log outgoing message:', logError)
  } catch (error) {
    console.error(`whatsapp-webhook enviarMensaje error for ${to}:`, error)
  }
}
