// Edge Function: prospeccion-buscar
// Busca empresas/contactos en Apollo.io y Hunter.io para prospección externa
// Recibe: query (empresa o dominio), fuente (apollo | hunter | ambos)

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

async function sbInsert(table: string, data: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...sbHeaders, Prefer: 'return=representation' },
    body: JSON.stringify(data),
  })
  return await res.json()
}

interface BusquedaRequest {
  query: string
  fuente?: 'apollo' | 'hunter' | 'ambos'
  limite?: number
  usuario_id?: string
}

interface Prospecto {
  nombre: string
  empresa: string
  cargo: string
  email: string | null
  telefono: string | null
  linkedin: string | null
  dominio: string | null
  fuente: string
  score: number
}

// Apollo.io — People Search API
async function buscarApollo(query: string, limite: number): Promise<Prospecto[]> {
  const APOLLO_KEY = Deno.env.get('APOLLO_API_KEY')
  if (!APOLLO_KEY) {
    console.log('[APOLLO SKIP] No APOLLO_API_KEY configured')
    return []
  }

  try {
    const res = await fetch('https://api.apollo.io/v1/mixed_people/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': APOLLO_KEY },
      body: JSON.stringify({
        q_organization_name: query,
        per_page: limite,
        person_titles: ['logistics', 'supply chain', 'operations', 'procurement', 'transportation', 'director', 'gerente', 'jefe'],
      }),
    })

    if (!res.ok) {
      console.error(`[APOLLO ERROR] ${res.status}: ${await res.text()}`)
      return []
    }

    const data = await res.json()
    return (data.people || []).map((p: Record<string, unknown>) => ({
      nombre: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
      empresa: (p.organization as Record<string, unknown>)?.name || query,
      cargo: (p.title as string) || '',
      email: (p.email as string) || null,
      telefono: (p.phone_number as string) || null,
      linkedin: (p.linkedin_url as string) || null,
      dominio: (p.organization as Record<string, unknown>)?.primary_domain || null,
      fuente: 'apollo',
      score: (p.email_status === 'verified') ? 90 : 60,
    }))
  } catch (err) {
    console.error(`[APOLLO ERROR] ${err}`)
    return []
  }
}

// Hunter.io — Domain Search API
async function buscarHunter(query: string, limite: number): Promise<Prospecto[]> {
  const HUNTER_KEY = Deno.env.get('HUNTER_API_KEY')
  if (!HUNTER_KEY) {
    console.log('[HUNTER SKIP] No HUNTER_API_KEY configured')
    return []
  }

  try {
    // Si query parece dominio, buscar directo; si no, buscar company name
    const isdominio = query.includes('.')
    const params = isdominio
      ? `domain=${encodeURIComponent(query)}&limit=${limite}&api_key=${HUNTER_KEY}`
      : `company=${encodeURIComponent(query)}&limit=${limite}&api_key=${HUNTER_KEY}`

    const res = await fetch(`https://api.hunter.io/v2/domain-search?${params}`)

    if (!res.ok) {
      console.error(`[HUNTER ERROR] ${res.status}: ${await res.text()}`)
      return []
    }

    const data = await res.json()
    const domain = data.data?.domain || query
    return (data.data?.emails || []).map((e: Record<string, unknown>) => ({
      nombre: `${e.first_name || ''} ${e.last_name || ''}`.trim() || 'N/A',
      empresa: data.data?.organization || query,
      cargo: (e.position as string) || '',
      email: (e.value as string) || null,
      telefono: (e.phone_number as string) || null,
      linkedin: (e.linkedin as string) || null,
      dominio: domain,
      fuente: 'hunter',
      score: e.confidence ? Math.round(e.confidence as number) : 50,
    }))
  } catch (err) {
    console.error(`[HUNTER ERROR] ${err}`)
    return []
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body: BusquedaRequest = await req.json()
    const { query, fuente = 'ambos', limite = 10, usuario_id } = body

    if (!query || query.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Query debe tener al menos 2 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let resultados: Prospecto[] = []

    if (fuente === 'apollo' || fuente === 'ambos') {
      const apollo = await buscarApollo(query, limite)
      resultados = [...resultados, ...apollo]
    }

    if (fuente === 'hunter' || fuente === 'ambos') {
      const hunter = await buscarHunter(query, limite)
      resultados = [...resultados, ...hunter]
    }

    // Deduplicar por email
    const seen = new Set<string>()
    const unicos = resultados.filter(r => {
      if (!r.email || seen.has(r.email)) return false
      seen.add(r.email)
      return true
    })

    // Ordenar por score descendente
    unicos.sort((a, b) => b.score - a.score)

    // Guardar búsqueda en prospeccion_externa
    for (const p of unicos.slice(0, 20)) {
      await sbInsert('prospeccion_externa', {
        nombre_contacto: p.nombre,
        empresa: p.empresa,
        cargo: p.cargo,
        email: p.email,
        telefono: p.telefono,
        linkedin_url: p.linkedin,
        dominio: p.dominio,
        fuente: p.fuente,
        score_enriquecimiento: p.score,
        estado: 'nuevo',
        buscado_por: usuario_id || null,
      })
    }

    return new Response(
      JSON.stringify({
        ok: true,
        query,
        fuente,
        total: unicos.length,
        resultados: unicos.slice(0, 20),
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
