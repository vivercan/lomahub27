// Analizar Contrato — IA lee PDF y extrae datos clave
const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

Deno.serve(async (req) => {
  const { base64pdf, tipo } = await req.json()

  const prompt = tipo === 'cotizacion'
    ? 'Analiza este PDF de solicitud de transporte. Extrae en JSON: origen, destino, tipo_equipo (seco/refrigerado), tarifa_propuesta, volumen_estimado, condiciones_especiales, moneda.'
    : 'Analiza este contrato de transporte. Identifica: cláusulas de riesgo para el transportista, penalizaciones, condiciones de pago, vigencia. Responde en JSON.'

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64pdf } },
          { type: 'text', text: prompt + ' Responde SOLO con JSON válido, sin texto adicional.' }
        ]
      }]
    })
  })

  const data = await response.json()
  const texto = data.content?.[0]?.text || '{}'

  try {
    const resultado = JSON.parse(texto)
    return new Response(JSON.stringify({ ok: true, datos: resultado }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch {
    return new Response(JSON.stringify({ ok: false, raw: texto }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
