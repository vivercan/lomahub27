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

      if (!response.ok) {
              const errorData = await response.text()
              return new Response(
                        JSON.stringify({ ok: false, error: 'Error API Anthrop/i/c 'A,n adleitzaalrl eC:o netrrraotroD a— tIaA  }l)e,e
                  P D F   y   e x{t rsatea tduast:o s5 0c2l,a vhee
                                  acdoenrsst:  A{N T'HCRoOnPtIeCn_tK-ETYy p=e 'D:e n'oa.pepnlvi.cgaetti(o'nA/NjTsHoRnO'P I}C _}A
                                    P I _ K E Y '))
! 

                                   D e}n
                                  o
                                  . s e r vceo(nassty ndca t(ar e=q )a w=a>i t{ 
                                    r e stproyn s{e
                                                  . j s o nc(o)n
                                                  s t   {  cboansset6 4tpedxft,o  t=i pdoa t}a .=c oanwtaeintt ?r.e[q0.]j?s.otne(x)t

                                                    | |   ' {i}f' 
                                                    (
                                                      ! b a s et6r4yp d{f
                                                    )   { 
                                                          c o n srte truersnu lnteawd oR e=s pJoSnOsNe.(p
                                                      a r s e ( t e x tJoS)O
                                                      N . s t r i nrgeitfuyr(n{  noekw:  Rfeaslpsoen,s ee(rJrSoOrN:. s'tSrei nrgeiqfuyi(e{r eo kb:a ster6u4ep,d fd'a t}o)s,:
                                                        r e s u l t a d{o  s}t)a,t u{s
                                                      :   4 0 0 ,   h ehaedaedresr:s :{  {' C'oCnotnetnetn-tT-yTpyep'e:' :' a'papplpilciactaitoino/nj/sjosno'n '}  }}

                                                                                    }))

                                                                              }}

                                                    c a t c hc o{n
                                                                 s t   p r o mrpett u=r nt inpeow  =R=e=s p'ocnostei(zJaScOiNo.ns't
                                                                 r i n g i f y?( {' Aonka:l ifzaal sees,t er aPwD:F  tdeex tsoo l}i)c,i t{u
                                                                   d   d e   t r a nhsepaodretres.:  E{x t'rCaoen teenn tJ-STOyNp:e 'o:r i'gaepnp,l idceasttiionno/,j stoinp'o _}e
                                                                 q u i p o   (}s)e
                                                                 c o / r e}f
                                                  r i g}e rcaadtoc)h,  (tearrri)f a{_
                                                                                    p r o p ureesttuar,n  vnoelwu mReens_peosntsiem(a
                                                                                                                                    d o ,   c o nJdSiOcNi.osntersi_negsipfeyc(i{a loeks:,  fmaolnseed,a .e'r
                                                                                      r o r :   ' E:r r'oArn ailnitzear neos't,e  dceotnatlrlaet:o  Sdter itnrga(nesrpro)r t}e)., 
                                                                                      I d e n t i f{i csat:a tculsá:u s5u0l0a,s  hdeea dreiress:g o{  p'aCroan teeln tt-rTaynpsep'o:r t'iasptpal,i cpaetniaolni/zjascoino'n e}s ,} 
                                                                                    c o n d i)c
                                                                                                                                                                                i o n}e
                                                                                    s} )de pago, vigencia. Responde en JSON.'

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

                                      if (!response.ok) {
                                              const errorData = await response.text()
                                              return new Response(
                                                        JSON.stringify({ ok: false, error: 'Error API Anthropic', detalle: errorData }),
                                                { status: 502, headers: { 'Content-Type': 'application/json' } }
                                                      )
                                      }

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
                                  } catch (err) {
                                        return new Response(
                                          JSON.stringify({ ok: false, error: 'Error interno', detalle: String(err) }),
                                    { status: 500, headers: { 'Content-Type': 'application/json' } }
                                        )
                                 }
      })
