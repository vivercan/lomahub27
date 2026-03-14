// Alerta Engine — Motor centralizado de alertas para LomaHUB27
// Procesa: machote inactivo, ETA imposible, tracto sin asignación,
//          unidad detenida, cita en riesgo. Envía por WA + email.
// SIN imports de esm.sh — usa fetch() directo al REST API de Supabase

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

// Helper: INSERT into Supabase table via REST API
async function sbInsert(table: string, data: Record<string, unknown>): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...sbHeaders, Prefer: 'return=minimal' },
    body: JSON.stringify(data),
  })
}

// Helper: SELECT from Supabase table via REST API
// deno-lint-ignore no-explicit-any
async function sbSelect(table: string, query: string): Promise<any[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: sbHeaders,
  })
  return await res.json()
}

// Tipos de alerta soportados
type TipoAlerta =
  | 'ALERTA_MACHOTE_INACTIVO'
  | 'ALERTA_ETA_IMPOSIBLE'
  | 'ALERTA_TRACTO_SIN_ASIGNACION'
  | 'ALERTA_UNIDAD_DETENIDA'
  | 'ALERTA_CITA_EN_RIESGO'
  | 'check_tractos_ociosos'
  | 'check_unidades_detenidas'
  | 'check_citas_en_riesgo'
  | 'run_all'

interface AlertaRequest {
  tipo: TipoAlerta
  viaje_id?: string
  tracto_id?: string
  // deno-lint-ignore no-explicit-any
  datos?: Record<string, any>
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body: AlertaRequest = await req.json()
    const { tipo } = body
    const resultados: string[] = []

    switch (tipo) {
      case 'ALERTA_MACHOTE_INACTIVO':
        resultados.push(await procesarMachoteInactivo(body))
        break

      case 'ALERTA_ETA_IMPOSIBLE':
        resultados.push(await procesarETAImposible(body))
        break

      case 'ALERTA_TRACTO_SIN_ASIGNACION':
        resultados.push(await procesarTractoSinAsignacion(body))
        break

      case 'ALERTA_UNIDAD_DETENIDA':
        resultados.push(await procesarUnidadDetenida(body))
        break

      case 'ALERTA_CITA_EN_RIESGO':
        resultados.push(await procesarCitaEnRiesgo(body))
        break

      case 'check_tractos_ociosos':
        resultados.push(await checkTractosOciosos())
        break

      case 'check_unidades_detenidas':
        resultados.push(await checkUnidadesDetenidas())
        break

      case 'check_citas_en_riesgo':
        resultados.push(await checkCitasEnRiesgo())
        break

      case 'run_all':
        resultados.push(await checkTractosOciosos())
        resultados.push(await checkUnidadesDetenidas())
        resultados.push(await checkCitasEnRiesgo())
        resultados.push(await evaluarLeadsEstancados())
        resultados.push(await evaluarFunnelInsuficiente())
        break

      default:
        return new Response(
          JSON.stringify({ error: `Tipo de alerta no soportado: ${tipo}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    return new Response(
      JSON.stringify({ ok: true, resultados }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Error interno', detalle: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ALERTAS INDIVIDUALES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function procesarMachoteInactivo(body: AlertaRequest): Promise<string> {
  const { viaje_id, datos } = body

  // Registrar alerta
  await sbInsert('alertas_pendientes', {
    tipo: 'ALERTA_MACHOTE_INACTIVO',
    viaje_id,
    datos: datos || { mensaje: 'FV/Machote con fecha de vigencia vencida' },
    canal: ['email', 'whatsapp'],
  })

  // Enviar email a CS
  await enviarEmail(
    'operaciones@trob.com.mx',
    '🚫 BLOQUEO: Machote inactivo en despacho',
    `El viaje ${viaje_id} tiene un formato de venta con vigencia vencida. ` +
    `El despacho ha sido BLOQUEADO hasta renovar el machote. ` +
    `Datos: ${JSON.stringify(datos)}`
  )

  // Enviar WhatsApp a operaciones
  await enviarWhatsApp(
    datos?.telefono_ops as string || '',
    `⚠️ BLOQUEO DESPACHO: Machote inactivo para viaje. Renovar FV antes de continuar.`
  )

  return `MACHOTE_INACTIVO: Alerta registrada y enviada para viaje ${viaje_id}`
}

async function procesarETAImposible(body: AlertaRequest): Promise<string> {
  const { viaje_id, datos } = body

  await sbInsert('alertas_pendientes', {
    tipo: 'ALERTA_ETA_IMPOSIBLE',
    viaje_id,
    datos: datos || {},
    canal: ['email', 'whatsapp'],
  })

  // Notificar CS + supervisor
  await enviarEmail(
    'cs@trob.com.mx',
    '⚠️ ETA Imposible detectado',
    `El viaje ${viaje_id} tiene un ETA que supera la cita por más de 2 horas. ` +
    `Se requiere confirmación manual o ajuste de cita. ` +
    `ETA: ${datos?.eta_timestamp || 'N/A'}, Cita: ${datos?.cita_descarga || 'N/A'}, ` +
    `Diferencia: ${datos?.diferencia_minutos || 'N/A'} minutos.`
  )

  return `ETA_IMPOSIBLE: Alerta registrada para viaje ${viaje_id}`
}

async function procesarTractoSinAsignacion(body: AlertaRequest): Promise<string> {
  const { tracto_id, datos } = body

  const horasOcioso = (datos?.horas_ocioso as number) || 0
  const costoHora = (datos?.costo_hora as number) || 0
  const costoAcumulado = horasOcioso * costoHora

  // Determinar nivel de severidad
  let nivel: 'aviso' | 'alerta' | 'critica' = 'aviso'
  if (horasOcioso >= 12) nivel = 'critica'
  else if (horasOcioso >= 8) nivel = 'alerta'

  await sbInsert('alertas_pendientes', {
    tipo: 'ALERTA_TRACTO_SIN_ASIGNACION',
    tracto_id,
    datos: { ...datos, nivel, costo_acumulado: costoAcumulado },
    canal: nivel === 'critica' ? ['whatsapp', 'email'] : ['whatsapp'],
  })

  // WhatsApp a operaciones siempre
  await enviarWhatsApp(
    '',
    `🚛 Tracto ${datos?.economico || tracto_id} ocioso ${horasOcioso}h ` +
    `| Costo: $${costoAcumulado.toLocaleString()} | Nivel: ${nivel.toUpperCase()}`
  )

  // Email a gerencia solo si > 8h
  if (horasOcioso >= 8) {
    await enviarEmail(
      'gerencia@trob.com.mx',
      `🔴 Tracto ${datos?.economico || ''} ocioso ${horasOcioso}h — Costo $${costoAcumulado.toLocaleString()}`,
      `El tracto ${datos?.economico || tracto_id} lleva ${horasOcioso} horas sin asignación. ` +
      `Costo acumulado estimado: $${costoAcumulado.toLocaleString()} MXN. ` +
      `Nivel de severidad: ${nivel.toUpperCase()}.`
    )
  }

  return `TRACTO_SIN_ASIGNACION: ${datos?.economico || tracto_id} — ${horasOcioso}h — $${costoAcumulado}`
}

async function procesarUnidadDetenida(body: AlertaRequest): Promise<string> {
  const { viaje_id, tracto_id, datos } = body

  await sbInsert('alertas_pendientes', {
    tipo: 'ALERTA_UNIDAD_DETENIDA',
    viaje_id,
    tracto_id,
    datos,
    canal: ['whatsapp', 'email'],
  })

  await enviarWhatsApp(
    '',
    `🛑 Unidad detenida en viaje activo. ` +
    `Tracto: ${datos?.economico || 'N/A'}, Ubicación: ${datos?.ubicacion || 'N/A'}, ` +
    `Tiempo detenido: ${datos?.minutos_detenido || '?'} min`
  )

  await enviarEmail(
    'cs@trob.com.mx',
    '🛑 Unidad detenida en ruta activa',
    `Se detectó una unidad detenida por más de 60 minutos en un viaje activo. ` +
    `Tracto: ${datos?.economico || 'N/A'}, Viaje: ${viaje_id || 'N/A'}, ` +
    `Ubicación: ${datos?.ubicacion || 'N/A'}, Tiempo: ${datos?.minutos_detenido || '?'} min.`
  )

  return `UNIDAD_DETENIDA: ${datos?.economico || tracto_id} — ${datos?.minutos_detenido}min`
}

async function procesarCitaEnRiesgo(body: AlertaRequest): Promise<string> {
  const { viaje_id, datos } = body

  await sbInsert('alertas_pendientes', {
    tipo: 'ALERTA_CITA_EN_RIESGO',
    viaje_id,
    datos,
    canal: ['whatsapp', 'email'],
  })

  // Notificar CS
  await enviarEmail(
    'cs@trob.com.mx',
    `⚠️ Cita en riesgo — Viaje ${datos?.folio || viaje_id}`,
    `El ETA recalculado supera la cita de descarga. ` +
    `Cliente: ${datos?.cliente || 'N/A'}, ` +
    `ETA: ${datos?.eta || 'N/A'}, Cita: ${datos?.cita || 'N/A'}, ` +
    `Diferencia: ${datos?.diferencia_min || '?'} minutos.`
  )

  // WhatsApp al cliente si hay teléfono
  if (datos?.telefono_cliente) {
    await enviarWhatsApp(
      datos.telefono_cliente as string,
      `Estimado cliente, le informamos que su entrega programada para ${datos?.cita || 'hoy'} ` +
      `podría presentar un retraso de aproximadamente ${datos?.diferencia_min || '?'} minutos. ` +
      `Nuestro equipo está trabajando para minimizar el impacto. Grupo Loma / TROB.`
    )
  }

  return `CITA_EN_RIESGO: Viaje ${datos?.folio || viaje_id} — ${datos?.diferencia_min}min retraso`
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CHECKS PERIÓDICOS (llamados por cron)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function checkTractosOciosos(): Promise<string> {
  // Leer umbrales de parametros_sistema
  const params = await sbSelect(
    'parametros_sistema',
    'select=clave,valor&clave=in.(umbral_ocioso_aviso,umbral_ocioso_alerta,umbral_ocioso_critica,costo_hora_tracto)'
  )

  const getParam = (clave: string, def: number) =>
    parseInt(params?.find((p: { clave: string; valor: string }) => p.clave === clave)?.valor || String(def))

  const umbralAviso = getParam('umbral_ocioso_aviso', 4)
  const costoHora = getParam('costo_hora_tracto', 250)

  // Buscar tractos disponibles (sin viaje activo)
  const tractos = await sbSelect(
    'tractos',
    'select=id,numero_economico,empresa,updated_at&estado_operativo=eq.disponible&activo=eq.true'
  )

  let alertasGeneradas = 0

  for (const tracto of tractos || []) {
    const horasOcioso = (Date.now() - new Date(tracto.updated_at).getTime()) / 3600000

    if (horasOcioso >= umbralAviso) {
      // Verificar si ya existe alerta no procesada para este tracto
      const existente = await sbSelect(
        'alertas_pendientes',
        `select=id&tipo=eq.ALERTA_TRACTO_SIN_ASIGNACION&tracto_id=eq.${tracto.id}&procesada=eq.false&limit=1`
      )

      if (!existente?.length) {
        await procesarTractoSinAsignacion({
          tipo: 'ALERTA_TRACTO_SIN_ASIGNACION',
          tracto_id: tracto.id,
          datos: {
            economico: tracto.numero_economico,
            empresa: tracto.empresa,
            horas_ocioso: Math.round(horasOcioso),
            costo_hora: costoHora,
          },
        })
        alertasGeneradas++
      }
    }
  }

  return `CHECK_TRACTOS: ${alertasGeneradas} alertas de ${tractos?.length || 0}`
}

async function checkUnidadesDetenidas(): Promise<string> {
  // Buscar viajes activos en tránsito
  const viajesActivos = await sbSelect(
    'viajes',
    'select=id,folio,tracto_id&estado=eq.en_transito'
  )

  let alertasGeneradas = 0

  for (const viaje of viajesActivos || []) {
    if (!viaje.tracto_id) continue

    // Obtener número económico del tracto
    const tractos = await sbSelect('tractos', `select=numero_economico&id=eq.${viaje.tracto_id}&limit=1`)
    const economico = tractos?.[0]?.numero_economico
    if (!economico) continue

    // Verificar GPS — velocidad 0 y último reporte hace más de 60 min
    const gps = await sbSelect(
      'gps_tracking',
      `select=velocidad,latitud,longitud,updated_at&economico=eq.${encodeURIComponent(economico)}&limit=1`
    )

    if (!gps?.length) continue
    const g = gps[0]

    const minutosDetenido = (Date.now() - new Date(g.updated_at).getTime()) / 60000

    if (g.velocidad === 0 && minutosDetenido > 60) {
      // Verificar si ya hay alerta activa
      const existente = await sbSelect(
        'alertas_pendientes',
        `select=id&tipo=eq.ALERTA_UNIDAD_DETENIDA&viaje_id=eq.${viaje.id}&procesada=eq.false&limit=1`
      )

      if (!existente?.length) {
        await procesarUnidadDetenida({
          tipo: 'ALERTA_UNIDAD_DETENIDA',
          viaje_id: viaje.id,
          tracto_id: viaje.tracto_id,
          datos: {
            economico,
            folio: viaje.folio,
            ubicacion: `${g.latitud}, ${g.longitud}`,
            minutos_detenido: Math.round(minutosDetenido),
          },
        })
        alertasGeneradas++
      }
    }
  }

  return `CHECK_UNIDADES_DETENIDAS: ${alertasGeneradas} alertas de ${viajesActivos?.length || 0} viajes`
}

async function checkCitasEnRiesgo(): Promise<string> {
  // Buscar viajes en tránsito con ETA recalculado
  const viajes = await sbSelect(
    'viajes',
    'select=id,folio,eta_calculado,cita_descarga,cliente_id&estado=in.(en_transito,en_riesgo)&eta_calculado=not.is.null'
  )

  // Leer umbral de parametros
  const paramArr = await sbSelect(
    'parametros_sistema',
    'select=valor&clave=eq.umbral_cita_riesgo_min&limit=1'
  )
  const umbralMinutos = parseInt(paramArr?.[0]?.valor || '30')

  let alertasGeneradas = 0

  for (const viaje of viajes || []) {
    if (!viaje.cita_descarga || !viaje.eta_calculado) continue

    const eta = new Date(viaje.eta_calculado)
    const cita = new Date(viaje.cita_descarga)
    const diferenciaMin = Math.round((eta.getTime() - cita.getTime()) / 60000)

    if (diferenciaMin > umbralMinutos) {
      const existente = await sbSelect(
        'alertas_pendientes',
        `select=id&tipo=eq.ALERTA_CITA_EN_RIESGO&viaje_id=eq.${viaje.id}&procesada=eq.false&limit=1`
      )

      if (!existente?.length) {
        // Get client name
        let clienteNombre = 'N/A'
        if (viaje.cliente_id) {
          const clientes = await sbSelect('clientes', `select=razon_social&id=eq.${viaje.cliente_id}&limit=1`)
          clienteNombre = clientes?.[0]?.razon_social || 'N/A'
        }

        await procesarCitaEnRiesgo({
          tipo: 'ALERTA_CITA_EN_RIESGO',
          viaje_id: viaje.id,
          datos: {
            folio: viaje.folio,
            cliente: clienteNombre,
            eta: viaje.eta_calculado,
            cita: viaje.cita_descarga,
            diferencia_min: diferenciaMin,
          },
        })
        alertasGeneradas++
      }
    }
  }

  return `CHECK_CITAS_EN_RIESGO: ${alertasGeneradas} alertas de ${viajes?.length || 0} viajes`
}

async function evaluarLeadsEstancados(): Promise<string> {
  const paramArr = await sbSelect(
    'parametros_sistema',
    'select=valor&clave=eq.dias_antiaca_recordatorio&limit=1'
  )

  const dias = parseInt(paramArr?.[0]?.valor || '7')
  const limite = new Date(Date.now() - dias * 86400000).toISOString()

  const leads = await sbSelect(
    'leads',
    `select=id,empresa,ejecutivo_id,fecha_ultimo_mov&estado=not.in.(ganado,perdido,congelado)&fecha_ultimo_mov=lt.${limite}`
  )

  for (const lead of leads || []) {
    console.log(`Lead ${lead.empresa} sin actividad desde ${lead.fecha_ultimo_mov}`)
  }

  return `CHECK_LEADS_ESTANCADOS: ${leads?.length || 0} leads sin actividad > ${dias} días`
}

async function evaluarFunnelInsuficiente(): Promise<string> {
  const paramArr = await sbSelect(
    'parametros_sistema',
    'select=valor&clave=eq.multiplicador_funnel&limit=1'
  )

  const multiplicador = parseInt(paramArr?.[0]?.valor || '10')
  let alertas = 0

  const mes = new Date().getMonth() + 1
  const anio = new Date().getFullYear()

  const metas = await sbSelect(
    'metas_ejecutivos',
    `select=usuario_id,meta_monto&mes=eq.${mes}&anio=eq.${anio}`
  )

  for (const meta of metas || []) {
    const opps = await sbSelect(
      'oportunidades',
      `select=valor_economico&ejecutivo_id=eq.${meta.usuario_id}&etapa=not.in.(ganado,perdido)`
    )

    const funnel = opps?.reduce((sum: number, o: { valor_economico: number }) => sum + (o.valor_economico || 0), 0) || 0
    const minimo = (meta.meta_monto || 0) * multiplicador

    if (funnel < minimo) {
      alertas++
      console.log(`Ejecutivo ${meta.usuario_id}: funnel ${funnel} < mínimo ${minimo}`)
    }
  }

  return `CHECK_FUNNEL: ${alertas} ejecutivos con funnel insuficiente`
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UTILIDADES DE ENVÍO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function enviarEmail(to: string, subject: string, body: string): Promise<void> {
  try {
    const RESEND_KEY = Deno.env.get('RESEND_API_KEY')
    const FROM = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@mail.v2.jjcrm27.com'

    if (!RESEND_KEY) {
      console.log(`[EMAIL SKIP] No RESEND_API_KEY — To: ${to}, Subject: ${subject}`)
      return
    }

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [to],
        subject,
        text: body,
      }),
    })

    console.log(`[EMAIL SENT] To: ${to}, Subject: ${subject}`)
  } catch (err) {
    console.error(`[EMAIL ERROR] ${err}`)
  }
}

async function enviarWhatsApp(telefono: string, mensaje: string): Promise<void> {
  try {
    const WA_TOKEN = Deno.env.get('WHATSAPP_API_TOKEN')
    const WA_PHONE_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')

    if (!WA_TOKEN || !WA_PHONE_ID || !telefono) {
      console.log(`[WA SKIP] No config o sin teléfono — Msg: ${mensaje.substring(0, 80)}...`)
      return
    }

    // Limpiar teléfono
    const tel = telefono.replace(/[^\d]/g, '')

    await fetch(`https://graph.facebook.com/v18.0/${WA_PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WA_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: tel,
        type: 'text',
        text: { body: mensaje },
      }),
    })

    console.log(`[WA SENT] To: ${tel}`)
  } catch (err) {
    console.error(`[WA ERROR] ${err}`)
  }
}
