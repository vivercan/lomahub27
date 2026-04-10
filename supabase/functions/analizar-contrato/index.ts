// Analizar Contrato — IA lee PDF y extrae datos clave
const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

Deno.serve(async (req) => {
  try {
    const { base64pdf, tipo } = await req.json()

    if (!base64pdf) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Se requiere base64pdf' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const prompt = tipo === 'cotizacion'
      ? 'Analiza este PDF de solicitud de transporte. Extrae en JSON: origen, destino, tipo_equipo (seco/refrigerado), tarifa_propuesta, volumen_estimado, condiciones_especiales, moneda.'
      : 'Analiza este contrato de transporte. Identifica: clausulas de riesgo para el transportista, penalizaciones, condiciones de pago, vigencia. Responde en JSON.'

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64pdf } },
            { type: 'text', text: prompt + ' Responde SOLO con JSON valido, sin texto adicional.' }
          ]
        }]
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      return new Response(
        JSON.stringify({ ok: false, error: 'Error API Anthropic', detalle: errorData }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    const content = data.content?.[0]?.text || ''

    let parsed
    try {
      parsed = JSON.parse(content)
    } catch {
      parsed = { raw: content }
    }

    return new Response(
      JSON.stringify({ ok: true, analisis: parsed, modelo: 'claude-haiku-4-5-20251001' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('analizar-contrato:', err)
    return new Response(
      JSON.stringify({ ok: false, error: 'Error interno', detalle: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
