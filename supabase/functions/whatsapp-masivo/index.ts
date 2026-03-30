// whatsapp-masivo — Envío masivo segmentado de oferta de equipo disponible
// Recibe plaza + tipo_equipo, consulta tractos/cajas disponibles, envía WA a contactos
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No autorizado')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { plaza, tipo_equipo, mensaje_custom } = await req.json()
    if (!plaza) throw new Error('Plaza es requerida')

    const { data: tractosDisp } = await supabase
      .from('tractos').select('numero_economico, empresa, segmento, estado_operativo')
      .eq('activo', true).ilike('segmento', `%${plaza}%`)

    const { data: cajasDisp } = await supabase
      .from('cajas').select('numero_economico, empresa, tipo, estado')
      .eq('activo', true).ilike('estado', `%${plaza}%`)

    let cajasFilter = cajasDisp || []
    if (tipo_equipo) {
      cajasFilter = cajasFilter.filter(c => c.tipo?.toUpperCase().includes(tipo_equipo.toUpperCase()))
    }

    const { data: clientes } = await supabase
      .from('clientes').select('id, razon_social, contacto_nombre, contacto_telefono')
      .eq('tipo', 'activo').not('contacto_telefono', 'is', null)

    const equipoTexto = [
      ...(tractosDisp || []).map(t => `Tracto ${t.numero_economico} (${t.empresa})`),
      ...cajasFilter.map(c => `Caja ${c.numero_economico} ${c.tipo} (${c.empresa})`),
    ].join('\n')

    const mensajeBase = mensaje_custom ||
      `Equipo disponible en ${plaza}\n\n${equipoTexto}\n\nContactenos para reservar.`

    const WA_TOKEN = Deno.env.get('WHATSAPP_TOKEN') || ''
    const WA_PHONE_ID = Deno.env.get('WHATSAPP_PHONE_ID') || ''
    const enviados: string[] = []
    const errores: string[] = []

    if (WA_TOKEN && WA_PHONE_ID) {
      for (const cliente of (clientes || [])) {
        if (!cliente.contacto_telefono) continue
        try {
          const tel = cliente.contacto_telefono.replace(/\D/g, '')
          if (tel.length < 10) continue
          await fetch(`https://graph.facebook.com/v18.0/${WA_PHONE_ID}/messages`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: tel.startsWith('52') ? tel : `52${tel}`,
              type: 'text', text: { body: mensajeBase },
            }),
          })
          enviados.push(cliente.razon_social)
        } catch (e) {
          errores.push(`${cliente.razon_social}: ${e instanceof Error ? e.message : 'Error'}`)
        }
      }
    }

    await supabase.from('logs_sistema').insert({
      tipo: 'whatsapp_masivo',
      detalle: { plaza, tipo_equipo, tractos: tractosDisp?.length || 0, cajas: cajasFilter.length, enviados: enviados.length },
    }).then(() => {}).catch(() => {})

    return new Response(JSON.stringify({
      ok: true, plaza, tipo_equipo: tipo_equipo || 'todos',
      equipo_disponible: { tractos: tractosDisp?.length || 0, cajas: cajasFilter.length },
      contactos_totales: clientes?.length || 0, enviados: enviados.length, errores: errores.length,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    return new Response(JSON.stringify({
      ok: false, mensaje: err instanceof Error ? err.message : 'Error interno',
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
