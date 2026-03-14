// Alerta Engine — Evalúa condiciones de alerta cada hora
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (_req) => {
  await Promise.all([
    evaluarTractosOciosos(),
    evaluarLeadsEstancados(),
    evaluarFunnelInsuficiente(),
  ])
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})

async function evaluarTractosOciosos() {
  const { data: params } = await supabase
    .from('parametros_sistema')
    .select('clave, valor')
    .in('clave', ['umbral_ocioso_advertencia', 'umbral_ocioso_critico'])

  const umbralAdv = parseInt(params?.find(p => p.clave === 'umbral_ocioso_advertencia')?.valor || '5')
  const umbralCrit = parseInt(params?.find(p => p.clave === 'umbral_ocioso_critico')?.valor || '12')

  const hace_adv = new Date(Date.now() - umbralAdv * 3600000).toISOString()

  const { data: ociosos } = await supabase
    .from('tractos')
    .select('id, numero_economico, empresa')
    .eq('estado_operativo', 'disponible')
    .eq('activo', true)

  for (const tracto of ociosos || []) {
    console.log(`Tracto ${tracto.numero_economico} ocioso — evaluar nivel`)
    // TODO: enviar notificación según nivel
  }
}

async function evaluarLeadsEstancados() {
  const { data: param } = await supabase
    .from('parametros_sistema')
    .select('valor')
    .eq('clave', 'dias_antiaca_recordatorio')
    .single()

  const dias = parseInt(param?.valor || '7')
  const limite = new Date(Date.now() - dias * 86400000).toISOString()

  const { data: leads } = await supabase
    .from('leads')
    .select('id, empresa, ejecutivo_id, fecha_ultimo_mov')
    .not('estado', 'in', '("ganado","perdido","congelado")')
    .lt('fecha_ultimo_mov', limite)

  for (const lead of leads || []) {
    console.log(`Lead ${lead.empresa} sin actividad desde ${lead.fecha_ultimo_mov}`)
    // TODO: notificar al ejecutivo
  }
}

async function evaluarFunnelInsuficiente() {
  const { data: param } = await supabase
    .from('parametros_sistema')
    .select('valor')
    .eq('clave', 'multiplicador_funnel')
    .single()

  const multiplicador = parseInt(param?.valor || '10')

  const { data: metas } = await supabase
    .from('metas_ejecutivos')
    .select('usuario_id, meta_monto')
    .eq('mes', new Date().getMonth() + 1)
    .eq('anio', new Date().getFullYear())

  for (const meta of metas || []) {
    const { data: opps } = await supabase
      .from('oportunidades')
      .select('valor_economico')
      .eq('ejecutivo_id', meta.usuario_id)
      .not('etapa', 'in', '("ganado","perdido")')

    const funnel = opps?.reduce((sum, o) => sum + (o.valor_economico || 0), 0) || 0
    const minimo = (meta.meta_monto || 0) * multiplicador

    if (funnel < minimo) {
      console.log(`Ejecutivo ${meta.usuario_id}: funnel ${funnel} < mínimo ${minimo}`)
    }
  }
}
