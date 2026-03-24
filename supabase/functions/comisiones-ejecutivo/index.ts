// Comisiones por Ejecutivo — Cálculo automático de comisiones sobre viajes facturados
// Cruza viajes cerrados con ejecutivo asignado (via leads/clientes) y aplica % de comisión

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No autorizado')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { mes, anio } = await req.json()

    // Build date range
    const inicio = `${anio}-${String(mes).padStart(2, '0')}-01`
    const lastDay = new Date(anio, mes, 0).getDate()
    const fin = `${anio}-${String(mes).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    // âââ Fetch comision config from parametros_sistema ââââ
    const { data: params } = await supabase
      .from('parametros_sistema')
      .select('clave, valor')
      .in('clave', ['comision_pct_default', 'comision_pct_nuevo_cliente', 'comision_sobre'])

    const config: Record<string, string> = {}
    for (const p of (params || [])) {
      config[p.clave] = p.valor
    }

    const comisionPctDefault = parseFloat(config.comision_pct_default || '3')
    const comisionPctNuevo = parseFloat(config.comision_pct_nuevo_cliente || '5')
    const comisionSobre = config.comision_sobre || 'ingreso' // 'ingreso' or 'margen'

    // âââ Fetch viajes in period ââââââââââââââââââââââââââ
    const { data: viajes } = await supabase
      .from('viajes')
      .select('id, cliente_id, ejecutivo_id, ingreso_estimado, costo_estimado, status, created_at')
      .gte('created_at', `${inicio}T00:00:00`)
      .lte('created_at', `${fin}T23:59:59`)

    // âââ Fetch clientes ââââââââââââââââââââââââââââââââââ
    const { data: clientes } = await supabase
      .from('clientes')
      .select('id, razon_social, empresa, created_at')

    const clienteMap = new Map((clientes || []).map(c => [c.id, c]))

    // Determine "new" clients — created in same month
    const newClientIds = new Set(
      (clientes || [])
        .filter(c => {
          const d = new Date(c.created_at)
          return d.getFullYear() === anio && (d.getMonth() + 1) === mes
        })
        .map(c => c.id)
    )

    // âââ Fetch ejecutivos (usuarios con rol ventas/cs) âââ
    const { data: usuarios } = await supabase
      .from('usuarios_autorizados')
      .select('email, nombre, rol, empresa')

    const ejecutivoMap = new Map(
      (usuarios || [])
        .filter(u => ['ventas', 'cs', 'gerente_comercial'].includes(u.rol))
        .map(u => [u.email, u])
    )

    // âââ Aggregate by ejecutivo ââââââââââââââââââââââââââ
    interface EjecutivoAgg {
      viajes: number
      ingreso: number
      costo: number
      clientes: Set<string>
      clientesNuevos: number
      comision: number
    }

    const agg: Record<string, EjecutivoAgg> = {}

    for (const v of (viajes || [])) {
      const ejId = v.ejecutivo_id
      if (!ejId) continue

      if (!agg[ejId]) {
        agg[ejId] = { viajes: 0, ingreso: 0, costo: 0, clientes: new Set(), clientesNuevos: 0, comision: 0 }
      }

      agg[ejId].viajes++
      agg[ejId].ingreso += v.ingreso_estimado || 0
      agg[ejId].costo += v.costo_estimado || 0

      if (v.cliente_id) {
        agg[ejId].clientes.add(v.cliente_id)
        if (newClientIds.has(v.cliente_id)) {
          agg[ejId].clientesNuevos++
        }
      }
    }

    // âââ Calculate commissions âââââââââââââââââââââââââââ
    const detalle: any[] = []
    let totalComisiones = 0
    let totalIngreso = 0
    let totalViajes = 0

    for (const [ejId, data] of Object.entries(agg)) {
      const base = comisionSobre === 'margen'
        ? (data.ingreso - data.costo)
        : data.ingreso

      // Apply higher rate for new clients
      // For simplicity: all viajes of new clients get higher rate
      const baseNuevos = 0 // Could be refined later
      const comisionNormal = base * (comisionPctDefault / 100)
      const bonusNuevos = data.clientesNuevos > 0
        ? base * ((comisionPctNuevo - comisionPctDefault) / 100) * (data.clientesNuevos / data.viajes)
        : 0

      const comisionTotal = comisionNormal + bonusNuevos

      const info = ejecutivoMap.get(ejId)
      const margen = data.ingreso > 0 ? ((data.ingreso - data.costo) / data.ingreso) * 100 : 0

      totalComisiones += comisionTotal
      totalIngreso += data.ingreso
      totalViajes += data.viajes

      detalle.push({
        ejecutivo_id: ejId,
        nombre: info?.nombre || ejId,
        email: ejId,
        empresa: info?.empresa || '',
        rol: info?.rol || '',
        viajes: data.viajes,
        clientes: data.clientes.size,
        clientes_nuevos: data.clientesNuevos,
        ingreso: data.ingreso,
        costo: data.costo,
        margen,
        base_comision: base,
        pct_aplicado: comisionPctDefault,
        pct_nuevos: comisionPctNuevo,
        comision: Math.round(comisionTotal * 100) / 100,
      })
    }

    // Sort by comision descending
    detalle.sort((a, b) => b.comision - a.comision)

    // Assign positions
    detalle.forEach((d, i) => { d.posicion = i + 1 })

    return new Response(JSON.stringify({
      ok: true,
      mes: `${anio}-${String(mes).padStart(2, '0')}`,
      config: {
        comision_pct_default: comisionPctDefault,
        comision_pct_nuevo_cliente: comisionPctNuevo,
        comision_sobre: comisionSobre,
      },
      resumen: {
        totalEjecutivos: detalle.length,
        totalViajes,
        totalIngreso,
        totalComisiones: Math.round(totalComisiones * 100) / 100,
        comisionPromedio: detalle.length > 0 ? Math.round((totalComisiones / detalle.length) * 100) / 100 : 0,
      },
      detalle,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    return new Response(JSON.stringify({
      ok: false,
      mensaje: err instanceof Error ? err.message : 'Error interno',
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
