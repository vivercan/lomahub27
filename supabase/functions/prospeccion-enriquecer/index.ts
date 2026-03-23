// Edge Function: prospeccion-enriquecer
// Enriquece un prospecto existente con datos adicionales de Apollo/Hunter
// y opcionalmente lo importa al pipeline de leads

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

async function sbInsert(table: string, data: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...sbHeaders, Prefer: 'return=representation' },
    body: JSON.stringify(data),
  })
  return await res.json()
}

// Enriquecer con Apollo — Email Finder
async function enriquecerApollo(nombre: string, empresa: string, dominio: string | null): Promise<Record<string, unknown>> {
  const APOLLO_KEY = Deno.env.get('APOLLO_API_KEY')
  if (!APOLLO_KEY) return {}

  try {
    const parts = nombre.split(' ')
    const firstName = parts[0] || ''
    const lastName = parts.slice(1).join(' ') || ''

    const res = await fetch('https://api.apollo.io/v1/people/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': APOLLO_KEY },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        organization_name: empresa,
        domain: dominio || undefined,
      }),
    })

    if (!res.ok) return {}
    const data = await res.json()
    const person = data.person || {}

    return {
      email_verificado: person.email || null,
      telefono: person.phone_number || null,
      linkedin_url: person.linkedin_url || null,
      cargo_actualizado: person.title || null,
      empresa_size: person.organization?.estimated_num_employees || null,
      empresa_industria: person.organization?.industry || null,
      empresa_revenue: person.organization?.annual_revenue || null,
      ciudad: person.city || null,
      pais: person.country || null,
    }
  } catch (err) {
    console.error(`[APOLLO ENRICH ERROR] ${err}`)
    return {}
  }
}

// Enriquecer con Hunter — Email Verifier
async function verificarEmailHunter(email: string): Promise<{ verificado: boolean; score: number }> {
  const HUNTER_KEY = Deno.env.get('HUNTER_API_KEY')
  if (!HUNTER_KEY || !email) return { verificado: false, score: 0 }

  try {
    const res = await fetch(`https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(email)}&api_key=${HUNTER_KEY}`)
    if (!res.ok) return { verificado: false, score: 0 }
    const data = await res.json()
    return {
      verificado: data.data?.result === 'deliverable',
      score: data.data?.score || 0,
    }
  } catch (err) {
    console.error(`[HUNTER VERIFY ERROR] ${err}`)
    return { verificado: false, score: 0 }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { accion, prospecto_id, usuario_id } = body

    if (!prospecto_id) {
      return new Response(
        JSON.stringify({ error: 'prospecto_id requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Leer prospecto actual
    const prospectos = await sbSelect('prospeccion_externa', `select=*&id=eq.${prospecto_id}&limit=1`) as Record<string, unknown>[]
    if (!prospectos?.length) {
      return new Response(
        JSON.stringify({ error: 'Prospecto no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const prospecto = prospectos[0]

    if (accion === 'enriquecer') {
      // Enriquecer con Apollo
      const apolloData = await enriquecerApollo(
        (prospecto.nombre_contacto as string) || '',
        (prospecto.empresa as string) || '',
        (prospecto.dominio as string) || null
      )

      // Verificar email con Hunter si existe
      const email = (apolloData.email_verificado as string) || (prospecto.email as string)
      let hunterResult = { verificado: false, score: 0 }
      if (email) {
        hunterResult = await verificarEmailHunter(email)
      }

      // Calcular score compuesto
      const score = Math.min(100, Math.round(
        (apolloData.email_verificado ? 30 : 0) +
        (hunterResult.verificado ? 30 : 0) +
        (apolloData.linkedin_url ? 15 : 0) +
        (apolloData.telefono ? 15 : 0) +
        (apolloData.empresa_size ? 10 : 0)
      ))

      // Actualizar prospecto
      await sbUpdate('prospeccion_externa', prospecto_id, {
        email: (apolloData.email_verificado as string) || prospecto.email,
        telefono: (apolloData.telefono as string) || prospecto.telefono,
        linkedin_url: (apolloData.linkedin_url as string) || prospecto.linkedin_url,
        cargo: (apolloData.cargo_actualizado as string) || prospecto.cargo,
        score_enriquecimiento: score,
        email_verificado: hunterResult.verificado,
        datos_enriquecidos: apolloData,
        estado: 'enriquecido',
        enriquecido_at: new Date().toISOString(),
      })

      return new Response(
        JSON.stringify({
          ok: true,
          prospecto_id,
          score,
          datos_apollo: apolloData,
          email_verificado: hunterResult.verificado,
          hunter_score: hunterResult.score,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (accion === 'importar_lead') {
      // Importar prospecto al pipeline de leads
      const lead = await sbInsert('leads', {
        empresa: prospecto.empresa,
        contacto_nombre: prospecto.nombre_contacto,
        contacto_email: prospecto.email,
        contacto_telefono: prospecto.telefono,
        estado: 'Nuevo',
        fuente: `prospeccion_${prospecto.fuente || 'externa'}`,
        ejecutivo_id: usuario_id || null,
        notas: `Importado desde prospección externa. Score: ${prospecto.score_enriquecimiento || 'N/A'}. ` +
               `Cargo: ${prospecto.cargo || 'N/A'}. LinkedIn: ${prospecto.linkedin_url || 'N/A'}.`,
      })

      // Actualizar estado del prospecto
      await sbUpdate('prospeccion_externa', prospecto_id, {
        estado: 'importado',
        importado_at: new Date().toISOString(),
        lead_id: (lead as Record<string, unknown>[])?.[0]?.id || null,
      })

      return new Response(
        JSON.stringify({ ok: true, mensaje: 'Prospecto importado al pipeline de leads', lead }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: `Acción no soportada: ${accion}. Use "enriquecer" o "importar_lead"` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Error interno', detalle: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
