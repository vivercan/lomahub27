// rentabilidad-tracto — Calcula ingreso, costo, margen y utilizacion por tracto
// Recibe mes/anio, devuelve analisis de rentabilidad por unidad
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

    const { mes, anio } = await req.json()
    if (!mes || !anio) throw new Error('mes y anio son requeridos')

    const inicio = \`\${anio}-\${String(mes).padStart(2, '0')}-01\`
    const lastDay = new Date(anio, mes, 0).getDate()
    const fin = \`\${anio}-\${String(mes).padStart(2, '0')}-\${String(lastDay).padStart(2, '0')}\`

    const { data: viajes } = await supabase
      .from('viajes')
      .select('id, tracto_id, cliente_id, ingreso_estimado, costo_estimado, km_estimados, estado, fecha_salida, fecha_llegada_real')
      .gte('fecha_salida', \`\${inicio}T00:00:00\`).lte('fecha_salida', \`\${fin}T23:59:59\`)

    const { data: tractos } = await supabase
      .from('tractos').select('id, numero_economico, empresa, segmento, estado_operativo, activo')
      .eq('activo', true)

    const tMap = new Map((tractos || []).map(t => [t.id, t]))

    interface TR { tracto_id: string; ne: string; empresa: string; seg: string; viajes: number; ingreso: number; costo: number; margen: number; margenPct: number; km: number; ingKm: number; diasAct: number; utilPct: number }
    const agg: Record<string, TR> = {}

    for (const v of (viajes || [])) {
      if (!v.tracto_id) continue
      const t = tMap.get(v.tracto_id)
      if (!t) continue
      if (!agg[v.tracto_id]) agg[v.tracto_id] = { tracto_id: v.tracto_id, ne: t.numero_economico, empresa: t.empresa, seg: t.segmento || '', viajes: 0, ingreso: 0, costo: 0, margen: 0, margenPct: 0, km: 0, ingKm: 0, diasAct: 0, utilPct: 0 }
      agg[v.tracto_id].viajes++
      agg[v.tracto_id].ingreso += v.ingreso_estimado || 0
      agg[v.tracto_id].costo += v.costo_estimado || 0
      agg[v.tracto_id].km += v.km_estimados || 0
      if (v.fecha_salida && v.fecha_llegada_real) {
        const d = Math.ceil((new Date(v.fecha_llegada_real).getTime() - new Date(v.fecha_salida).getTime()) / 86400000)
        agg[v.tracto_id].diasAct += Math.max(d, 1)
      } else { agg[v.tracto_id].diasAct += 1 }
    }

    const detalle: TR[] = []
    let totIng = 0, totCos = 0

    for (const r of Object.values(agg)) {
      r.margen = r.ingreso - r.costo
      r.margenPct = r.ingreso > 0 ? Math.round((r.margen / r.ingreso) * 1000) / 10 : 0
      r.ingKm = r.km > 0 ? Math.round((r.ingreso / r.km) * 100) / 100 : 0
      r.utilPct = Math.round((r.diasAct / lastDay) * 100)
      totIng += r.ingreso; totCos += r.costo
      detalle.push(r)
    }

    const tractosConViajes = new Set(Object.keys(agg))
    const ociosos = (tractos || []).filter(t => !tractosConViajes.has(t.id)).length
    detalle.sort((a, b) => b.margen - a.margen)

    return new Response(JSON.stringify({
      ok: true, periodo: \`\${anio}-\${String(mes).padStart(2, '0')}\`,
      resumen: {
        con_viajes: detalle.length, ociosos, total_viajes: detalle.reduce((s, d) => s + d.viajes, 0),
        total_ingreso: totIng, total_costo: totCos, total_margen: totIng - totCos,
        margen_pct: totIng > 0 ? Math.round(((totIng - totCos) / totIng) * 1000) / 10 : 0,
        util_promedio: detalle.length > 0 ? Math.round(detalle.reduce((s, d) => s + d.utilPct, 0) / detalle.length) : 0,
      },
      top5: detalle.slice(0, 5), bottom5: detalle.slice(-5).reverse(), ociosos, detalle,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('rentabilidad-tracto:', err)
    return new Response(JSON.stringify({
      ok: false, mensaje: err instanceof Error ? err.message : 'Error interno',
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
