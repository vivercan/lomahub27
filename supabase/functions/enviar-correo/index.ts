// Enviar Correo — Envío transaccional y masivo via Resend
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@mail.v2.jjcrm27.com'

const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

Deno.serve(async (req) => {
    try {
          const { to, subject, html, text, tipo, cliente_id } = await req.json()

      if (!to || !subject) {
              return new Response(
                        JSON.stringify({ error: 'Campos requeridos: to, subject' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
                      )
      }

      const res = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                        'Authorization': `Bearer ${RESEND_KEY}`,
                        'Content-Type': 'application/json'
              },
              body: JSON.stringify({ from: FROM, to, subject, html, text })
      })

      const data = await res.json()

      if (cliente_id) {
              await supabase.from('correos_log').insert({
                        cliente_id,
                        asunto: subject,
                        tipo: tipo || 'general',
                        estado: res.ok ? 'enviado' : 'error'
              })
      }

      return new Response(JSON.stringify(data), {
              status: res.ok ? 200 : 500,
              headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {
          return new Response(
                  JSON.stringify({ error: 'Error interno', detalle: S/t/r iEnngv(iearrr )C o}r)r,e
            o   —  E n v í{o  sttraatnussa:c c5i0o0n,a lh eya dmearssi:v o{  v'iCao nRteesnetn-dT
            yipmep'o:r t' a{p pclriecaatteiColni/ejnsto n}'  f}r o}m
              ' h t t)p
            s : /}/
                                                                           e}s)m.sh/@supabase/supabase-js@2'

      const RESEND_KEY = Deno.env.get('RESEND_API_KEY')!
                           const FROM = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@mail.v2.jjcrm27.com'

      const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

      Deno.serve(async (req) => {
          try {
                const { to, subject, html, text, tipo, cliente_id } = await req.json()

            if (!to || !subject) {
                    return new Response(
                              JSON.stringify({ error: 'Campos requeridos: to, subject' }),
                      { status: 400, headers: { 'Content-Type': 'application/json' } }
                            )
            }

            const res = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                              'Authorization': `Bearer ${RESEND_KEY}`,
                              'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ from: FROM, to, subject, html, text })
            })

            const data = await res.json()

            if (cliente_id) {
                    await supabase.from('correos_log').insert({
                              cliente_id,
                              asunto: subject,
                              tipo: tipo || 'general',
                              estado: res.ok ? 'enviado' : 'error'
                    })
            }

            return new Response(JSON.stringify(data), {
                    status: res.ok ? 200 : 500,
                    headers: { 'Content-Type': 'application/json' }
            })
          } catch (err) {
                return new Response(
                        JSON.stringify({ error: 'Error interno', detalle: String(err) }),
                  { status: 500, headers: { 'Content-Type': 'application/json' } }
                      )
          }
      })
