// Edge Function: escalamiento-whatsapp
// Gestiona escalamientos de conversaciones WhatsApp a supervisor/gerencia/dirección
// Acciones: listar, crear, escalar (subir nivel), asignar, resolver, cerrar

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

// Enviar notificación WhatsApp
async function enviarWhatsApp(telefono: string, mensaje: string): Promise<void> {
  try {
    const WA_TOKEN = Deno.env.get('WHATSAPP_API_TOKEN')
    const WA_PHONE_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
    if (!WA_TOKEN || !WA_PHONE_ID || !telefono) {
      console.log(`[WA SKIP] No config — Msg: ${mensaje.substring(0, 80)}...`)
      return
    }
    const tel = telefono.replace(/[^\d]/g, '')
    await fetch(`https://graph.facebook.com/v18.0/${WA_PHONE_ID}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: tel, type: 'text', text: { body: mensaje } }),
    })
    console.log(`[WA SENT] To: ${tel}`)
  } catch (err) { console.error(`[WA ERROR] ${err}`) }
}

// Enviar email
async function enviarEmail(to: string, subject: string, body: string): Promise<void> {
  try {
    const RESEND_KEY = Deno.env.get('RESEND_API_KEY')
    const FROM = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@mail.jjcrm27.com'
    if (!RESEND_KEY) { console.log(`[EMAIL SKIP] No RESEND_API_KEY`); return }
    const resEmail = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [to], subject, text: body }),
    })
    if (!resEmail.ok) {
      const errBody = await resEmail.text()
      console.error('escalamiento-whatsapp Resend error:', resEmail.status, errBody)
    }
    console.log(`[EMAIL SENT] To: ${to}, Subject: ${subject}`)
  } catch (err) { console.error(`[EMAIL ERROR] ${err}`) }
}

// Obtener responsable por nivel
function getResponsablePorNivel(nivel: number): { email: string; nombre: string } {
  switch (nivel) {
    case 1: return { email: 'jennifer@trob.com.mx', nombre: 'Jennifer Sánchez (Supervisor)' }
    case 2: return { email: 'jennifer@trob.com.mx', nombre: 'Jennifer Sánchez (Gerencia)' }
    case 3: return { email: 'juan.viveros@trob.com.mx', nombre: 'Juan Viveros (Dirección)' }
    default: return { email: 'jennifer@trob.com.mx', nombre: 'Jennifer Sánchez' }
  }
}

const nivelNombre: Record<number, string> = { 1: 'Supervisor', 2: 'Gerencia', 3: 'Dirección' }

interface Escalamiento {
  id?: string
  cliente_nombre: string
  cliente_telefono: string
  motivo: string
  descripcion?: string
  nivel?: number
  prioridad?: string
  estado?: string
  asignado_a?: string
  conversacion_id?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { accion } = body

    switch (accion) {
      case 'crear': {
        const esc: Escalamiento = body
        const nivel = esc.nivel || 1
        const responsable = getResponsablePorNivel(nivel)

        const resultado = await sbInsert('escalamientos_whatsapp', {
          cliente_nombre: esc.cliente_nombre,
          cliente_telefono: esc.cliente_telefono,
          motivo: esc.motivo,
          descripcion: esc.descripcion || null,
          nivel,
          prioridad: esc.prioridad || 'media',
          estado: 'pendiente',
          asignado_a: esc.asignado_a || null,
          conversacion_id: esc.conversacion_id || null,
        })

        // Notificar al responsable
        await enviarEmail(
          responsable.email,
          `🚨 Escalamiento WhatsApp — ${nivelNombre[nivel]} — ${esc.cliente_nombre}`,
          `Se ha creado un escalamiento de nivel ${nivelNombre[nivel]}.\n\n` +
          `Cliente: ${esc.cliente_nombre}\nTeléfono: ${esc.cliente_telefono}\n` +
          `Motivo: ${esc.motivo}\nPrioridad: ${esc.prioridad || 'media'}\n` +
          `Descripción: ${esc.descripcion || 'N/A'}\n\n` +
          `Ingresa a v2.jjcrm27.com/servicio/escalamiento-whatsapp para gestionar.`
        )

        // Confirmar al cliente por WA
        if (esc.cliente_telefono) {
          await enviarWhatsApp(
            esc.cliente_telefono,
            `Estimado(a) ${esc.cliente_nombre}, su caso ha sido escalado a ${nivelNombre[nivel]}. ` +
            `Un responsable le contactará a la brevedad. Referencia: ${(resultado as { id: string }[])?.[0]?.id?.substring(0, 8) || 'N/A'}. Grupo Loma / TROB.`
          )
        }

        return new Response(
          JSON.stringify({ ok: true, escalamiento: resultado, responsable: responsable.nombre }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'escalar': {
        const { id } = body
        // Leer escalamiento actual
        const existente = await sbSelect('escalamientos_whatsapp', `select=*&id=eq.${id}&limit=1`) as Record<string, unknown>[]
        if (!existente?.length) {
          return new Response(JSON.stringify({ error: 'Escalamiento no encontrado' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const esc = existente[0]
        const nivelActual = (esc.nivel as number) || 1
        if (nivelActual >= 3) {
          return new Response(JSON.stringify({ error: 'Ya está en nivel máximo (Dirección)' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const nuevoNivel = nivelActual + 1
        const responsable = getResponsablePorNivel(nuevoNivel)

        await sbUpdate('escalamientos_whatsapp', id, {
          nivel: nuevoNivel,
          estado: 'pendiente',
          escalado_at: new Date().toISOString(),
        })

        // Notificar nuevo responsable
        await enviarEmail(
          responsable.email,
          `🔺 Escalamiento SUBIDO a ${nivelNombre[nuevoNivel]} — ${esc.cliente_nombre}`,
          `Un caso ha sido escalado de ${nivelNombre[nivelActual]} a ${nivelNombre[nuevoNivel]}.\n\n` +
          `Cliente: ${esc.cliente_nombre}\nMotivo: ${esc.motivo}\n` +
          `Prioridad: ${esc.prioridad}\n\nIngresa a v2.jjcrm27.com/servicio/escalamiento-whatsapp`
        )

        return new Response(
          JSON.stringify({ ok: true, nivel_anterior: nivelActual, nivel_nuevo: nuevoNivel, responsable: responsable.nombre }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'asignar': {
        const { id, asignado_a, asignado_nombre } = body
        await sbUpdate('escalamientos_whatsapp', id, {
          asignado_a,
          estado: 'asignado',
        })

        return new Response(
          JSON.stringify({ ok: true, mensaje: `Asignado a ${asignado_nombre || asignado_a}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'resolver': {
        const { id, resolucion } = body
        const existente = await sbSelect('escalamientos_whatsapp', `select=*&id=eq.${id}&limit=1`) as Record<string, unknown>[]
        if (!existente?.length) {
          return new Response(JSON.stringify({ error: 'No encontrado' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const esc = existente[0]
        await sbUpdate('escalamientos_whatsapp', id, {
          estado: 'resuelto',
          resolucion: resolucion || 'Resuelto',
          resuelto_at: new Date().toISOString(),
        })

        // Notificar al cliente
        if (esc.cliente_telefono) {
          await enviarWhatsApp(
            esc.cliente_telefono as string,
            `Estimado(a) ${esc.cliente_nombre}, su caso ha sido resuelto. ` +
            `${resolucion ? 'Resolución: ' + resolucion + '. ' : ''}` +
            `Si requiere algo más, estamos para servirle. Grupo Loma / TROB.`
          )
        }

        return new Response(
          JSON.stringify({ ok: true, mensaje: 'Escalamiento resuelto y cliente notificado' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'cerrar': {
        const { id } = body
        await sbUpdate('escalamientos_whatsapp', id, {
          estado: 'cerrado',
          cerrado_at: new Date().toISOString(),
        })
        return new Response(
          JSON.stringify({ ok: true, mensaje: 'Escalamiento cerrado' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: `Acción no soportada: ${accion}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Error interno', detalle: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
