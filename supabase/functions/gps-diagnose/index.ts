// GPS Diagnose — Prueba varios métodos SOAP de WideTech (ShareService)
// Invocar: POST https://{proj}.supabase.co/functions/v1/gps-diagnose
// Regresa: para cada método probado, status + cantidad de <Plate> en response
// Objetivo: encontrar cuál método SOAP regresa TODAS las unidades del login
// (no solo las con reporte reciente, que es lo que hace HistoyDataLastLocationByUser)

Deno.serve(async (req) => {
  const GPS_URL = Deno.env.get('GPS_API_URL')!
  const GPS_USER = Deno.env.get('GPS_API_USER')!
  const GPS_PASS = Deno.env.get('GPS_API_PASS')!

  if (!GPS_URL || !GPS_USER || !GPS_PASS) {
    return json({ ok: false, error: 'Missing GPS secrets' }, 500)
  }

  // ═══ MODE: WSDL dump — lista todos los métodos disponibles ═══
  const url = new URL(req.url)
  if (url.searchParams.get('mode') === 'wsdl') {
    const wsdlUrls = [
      `${GPS_URL}?WSDL`,
      `${GPS_URL}?wsdl`,
      `${GPS_URL.replace(/\.asmx$/, '')}.asmx?WSDL`,
    ]
    for (const wsdlUrl of wsdlUrls) {
      try {
        const r = await fetch(wsdlUrl, { method: 'GET' })
        if (r.status === 200) {
          const text = await r.text()
          // Extraer todos los operation names
          const ops = [...text.matchAll(/<(?:wsdl:)?operation\s+name="([^"]+)"/g)].map(m => m[1])
          const unique = [...new Set(ops)].sort()
          return json({
            ok: true,
            mode: 'wsdl',
            url_used: wsdlUrl,
            body_length: text.length,
            operations_count: unique.length,
            operations: unique,
            preview: text.substring(0, 500)
          })
        }
      } catch (_e) { /* try next */ }
    }
    return json({ ok: false, error: 'Could not fetch WSDL from any URL', triedUrls: wsdlUrls })
  }

  const NS = 'http://shareservice.co/'
  // Rango 30 días atrás para métodos con fecha
  const fechaIni = new Date(Date.now() - 30 * 86400 * 1000).toISOString().slice(0, 19)
  const fechaFin = new Date().toISOString().slice(0, 19)

  // Métodos REALES del WSDL — 24/Abr 2026
  const methods = [
    { name: 'HistoyDataLastLocationByUser',              body: `<sLogin>${GPS_USER}</sLogin><sPassword>${GPS_PASS}</sPassword>` },
    { name: 'HistoryDataLastLocationByUserAttributes',   body: `<sLogin>${GPS_USER}</sLogin><sPassword>${GPS_PASS}</sPassword>` },
    { name: 'HistoryDataLastLocationByUserRenderExcel',  body: `<sLogin>${GPS_USER}</sLogin><sPassword>${GPS_PASS}</sPassword>` },
    { name: 'HistoyDataLastLocationByUser_JSON',         body: `<sLogin>${GPS_USER}</sLogin><sPassword>${GPS_PASS}</sPassword>` },
    { name: 'GetMobileList',                             body: `<sLogin>${GPS_USER}</sLogin><sPassword>${GPS_PASS}</sPassword>` },
    { name: 'GetPersonList',                             body: `<sLogin>${GPS_USER}</sLogin><sPassword>${GPS_PASS}</sPassword>` },
    { name: 'GetDataReplicator',                         body: `<sLogin>${GPS_USER}</sLogin><sPassword>${GPS_PASS}</sPassword>` },
    { name: 'GetEventsHighPriority',                     body: `<sLogin>${GPS_USER}</sLogin><sPassword>${GPS_PASS}</sPassword>` },
    { name: 'GetLastTransmissionPegaso',                 body: `<sLogin>${GPS_USER}</sLogin><sPassword>${GPS_PASS}</sPassword>` },
  ]

  const results = []

  for (const m of methods) {
    try {
      const soap = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body><${m.name} xmlns="${NS}">${m.body}</${m.name}></soap:Body>
</soap:Envelope>`

      const res = await fetch(GPS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': `"${NS}${m.name}"`
        },
        body: soap
      })
      const xml = await res.text()
      const plateCount = (xml.match(/<Plate[\s>]/g) || []).length
      const unitCount = (xml.match(/<(Unit|Device|Vehiculo|Unidad)[\s>]/gi) || []).length
      const codeMatch = xml.match(/<code>(\d+)<\/code>/)
      const descMatch = xml.match(/<description>([^<]+)<\/description>/)
      const faultMatch = xml.match(/<faultstring[^>]*>([^<]+)<\/faultstring>/)

      results.push({
        method: m.name,
        http_status: res.status,
        plate_count: plateCount,
        unit_count: unitCount,
        code: codeMatch ? codeMatch[1] : null,
        description: descMatch ? descMatch[1] : null,
        fault: faultMatch ? faultMatch[1].substring(0, 120) : null,
        body_length: xml.length,
        preview: xml.substring(0, 250)
      })

      // Rate limit protection entre métodos (WideTech tiene 40s rate-limit)
      await new Promise(r => setTimeout(r, 1500))
    } catch (e) {
      results.push({ method: m.name, error: (e as Error).message })
    }
  }

  // Sort by plate_count desc
  results.sort((a, b) => (b.plate_count || 0) - (a.plate_count || 0))

  return json({
    ok: true,
    timestamp: new Date().toISOString(),
    tested_methods: methods.length,
    winners: results.filter(r => r.plate_count > 51),
    all_results: results,
  })
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}
