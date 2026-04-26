// supabase/functions/clasificar-correo/index.ts
// Bajado de Supabase 2026-04-19 — C-016 resuelto: Edge Function existía ACTIVE en BD
// sin source en repo. Esta copia es la oficial y debe commitearse al repo principal.
// Nota: se integra con Make.com para clasificación de correos vía Anthropic.

import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { system_prompt, user_message, max_tokens = 2500, temperature = 0.1 } = await req.json()

    if (!system_prompt || !user_message) {
      return new Response(JSON.stringify({ error: 'system_prompt and user_message are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: max_tokens,
        temperature: temperature,
        messages: [
          {
            role: 'user',
            content: user_message
          }
        ],
        system: system_prompt
      })
    })

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text()
      return new Response(JSON.stringify({ error: 'Anthropic API error', status: anthropicResponse.status, detail: errText }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const result = await anthropicResponse.json()

    // Extract the text content from Claude's response
    const textContent = result.content.find(c => c.type === 'text')
    const responseText = textContent ? textContent.text : ''

    // Return in a format compatible with the OpenAI module output
    // so Make.com can parse it the same way
    return new Response(JSON.stringify({
      result: responseText,
      model: result.model,
      usage: result.usage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
