/**
 * Supabase Edge Function: OCR Documento Procesamiento
 *
 * Processes scanned documents (PDFs, images) using Google Gemini Flash model
 * to extract structured data (folio, dates, amounts, etc.) via OCR.
 *
 * Supported document types:
 * - carta_porte: Extract shipping manifest details
 * - factura: Extract invoice details and line items
 * - pod: Extract proof of delivery information
 * - general: Extract all text and key-value pairs
 *
 * Deploy with: supabase functions deploy ocr-documento-index
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type DocumentTipo = 'carta_porte' | 'factura' | 'pod' | 'general'

interface OCRRequest {
  base64doc: string
  tipo: DocumentTipo
  filename?: string
}

interface OCRResponse {
  ok: boolean
  tipo: DocumentTipo
  datos: Record<string, any>
  texto_completo: string
  error?: string
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts: Array<{ text?: string }>
    }
  }>
  error?: {
    message: string
  }
}

// ============================================================================
// PROMPT TEMPLATES BY DOCUMENT TYPE
// ============================================================================

const PROMPTS: Record<DocumentTipo, string> = {
  carta_porte: `Analiza este documento de Carta Porte (manifesto de envío) y extrae EXACTAMENTE los siguientes campos:
- folio: Número de folio/referencia
- origen: Ciudad o ubicación de origen
- destino: Ciudad o ubicación de destino
- peso: Peso total de la carga (con unidad)
- unidad: Unidad de medida (kg, ton, etc)
- operador: Nombre del operador o transportista
- fecha: Fecha del documento (formato YYYY-MM-DD si es posible)

Responde UNICAMENTE con JSON válido en este formato exacto:
{
  "folio": "valor",
  "origen": "valor",
  "destino": "valor",
  "peso": "valor",
  "unidad": "valor",
  "operador": "valor",
  "fecha": "valor"
}

Si algún campo no está disponible, usa null. NO agregues explicaciones, solo JSON.`,

  factura: `Analiza este documento de Factura y extrae EXACTAMENTE los siguientes campos:
- rfc_emisor: RFC del que emite la factura
- rfc_receptor: RFC del que recibe la factura
- folio: Número de folio/serie
- fecha: Fecha de la factura (formato YYYY-MM-DD si es posible)
- subtotal: Subtotal (número solo, sin símbolo)
- iva: IVA/impuestos (número solo)
- total: Total de la factura (número solo)
- conceptos: Array de objetos con {descripcion, cantidad, precio_unitario, importe}

Responde UNICAMENTE con JSON válido en este formato exacto:
{
  "rfc_emisor": "valor",
  "rfc_receptor": "valor",
  "folio": "valor",
  "fecha": "valor",
  "subtotal": 0.00,
  "iva": 0.00,
  "total": 0.00,
  "conceptos": []
}

Si algún campo no está disponible, usa null para strings o [] para arrays. NO agregues explicaciones, solo JSON.`,

  pod: `Analiza este documento de Prueba de Entrega (POD) y extrae EXACTAMENTE los siguientes campos:
- folio_viaje: Número de folio del viaje
- fecha_entrega: Fecha de entrega (formato YYYY-MM-DD si es posible)
- recibio_nombre: Nombre de quién recibió
- firma_presente: true si hay firma, false si no, null si no está claro
- observaciones: Cualquier nota u observación en el documento

Responde UNICAMENTE con JSON válido en este formato exacto:
{
  "folio_viaje": "valor",
  "fecha_entrega": "valor",
  "recibio_nombre": "valor",
  "firma_presente": true,
  "observaciones": "valor"
}

Si algún campo no está disponible, usa null. NO agregues explicaciones, solo JSON.`,

  general: `Analiza este documento y extrae TODO el texto legible y los pares clave-valor que encuentres.

Responde UNICAMENTE con JSON válido en este formato exacto:
{
  "texto_completo": "Todo el texto extraído del documento...",
  "campos_encontrados": {
    "campo1": "valor1",
    "campo2": "valor2"
  }
}

Intenta identificar:
- Números de referencia/folio
- Fechas
- Nombres de personas o empresas
- Cantidades o montos
- Ubicaciones

NO agregues explicaciones, solo JSON.`
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Send request to Google Gemini API with document
 */
async function callGeminiAPI(
  prompt: string,
  base64doc: string,
  mimeType: string = 'application/pdf'
): Promise<string> {
  const geminiKey = Deno.env.get('GEMINI_API_KEY')
  if (!geminiKey) {
    throw new Error('GEMINI_API_KEY not configured in environment')
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`

  const requestBody = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64doc
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 4096
    }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(
      `Gemini API error: ${response.status} ${errorData.error?.message || response.statusText}`
    )
  }

  const data: GeminiResponse = await response.json()

  if (data.error) {
    throw new Error(`Gemini error: ${data.error.message}`)
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    throw new Error('No response from Gemini API')
  }

  return text
}

/**
 * Parse JSON response from Gemini, with fallback handling
 */
function parseGeminiResponse(text: string): Record<string, any> {
  try {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0])
    return parsed
  } catch (error) {
    console.error('Error parsing Gemini response:', error)
    // Return raw text in a structured format if JSON parsing fails
    return {
      _parse_error: true,
      texto_completo: text,
      campos_encontrados: {}
    }
  }
}

/**
 * Validate and normalize base64 input
 */
function validateBase64(base64: string): string {
  if (!base64 || typeof base64 !== 'string') {
    throw new Error('base64doc must be a non-empty string')
  }

  // Remove any whitespace and data URI prefix if present
  let cleaned = base64.trim()
  if (cleaned.includes(',')) {
    cleaned = cleaned.split(',')[1]
  }

  return cleaned
}

// ============================================================================
// MAIN EDGE FUNCTION
// ============================================================================

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'Method not allowed. Use POST.'
      }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }

  try {
    // Parse request body
    const payload: OCRRequest = await req.json()

    // Validate required fields
    if (!payload.tipo || !Object.keys(PROMPTS).includes(payload.tipo)) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: `Invalid tipo. Must be one of: ${Object.keys(PROMPTS).join(', ')}`
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    // Validate base64 document
    const base64doc = validateBase64(payload.base64doc)

    // Determine MIME type from filename or default to PDF
    let mimeType = 'application/pdf'
    if (payload.filename) {
      if (payload.filename.toLowerCase().endsWith('.png')) {
        mimeType = 'image/png'
      } else if (payload.filename.toLowerCase().endsWith('.jpg') || payload.filename.toLowerCase().endsWith('.jpeg')) {
        mimeType = 'image/jpeg'
      } else if (payload.filename.toLowerCase().endsWith('.gif')) {
        mimeType = 'image/gif'
      } else if (payload.filename.toLowerCase().endsWith('.webp')) {
        mimeType = 'image/webp'
      }
    }

    // Call Gemini API
    const prompt = PROMPTS[payload.tipo]
    const geminiResponse = await callGeminiAPI(prompt, base64doc, mimeType)

    // Parse response
    const parsedData = parseGeminiResponse(geminiResponse)

    // Store in database if authenticated
    let dbInserted = false
    try {
      const authHeader = req.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')

        if (supabaseUrl && supabaseKey) {
          const client = createClient(supabaseUrl, supabaseKey)

          // Extract user from token if available
          const token = authHeader.substring(7)
          const { data: userData } = await client.auth.getUser(token)

          const insertData: any = {
            tipo: payload.tipo,
            datos: parsedData,
            texto_completo: geminiResponse,
            archivo_nombre: payload.filename || null,
            usuario_id: userData?.user?.id || null
          }

          const { error: insertError } = await client
            .from('documentos_ocr')
            .insert([insertData])

          if (insertError) {
            console.error('Database insert error:', insertError)
          } else {
            dbInserted = true
          }
        }
      }
    } catch (dbError) {
      // Log but don't fail the request if database insertion fails
      console.error('Database operation failed:', dbError)
    }

    // Build response
    const response: OCRResponse = {
      ok: true,
      tipo: payload.tipo,
      datos: parsedData,
      texto_completo: geminiResponse
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    // Handle errors gracefully
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    console.error('OCR Processing error:', errorMessage)

    return new Response(
      JSON.stringify({
        ok: false,
        error: errorMessage
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})

// ============================================================================
// SQL MIGRATION - Run this to create the documentos_ocr table
// ============================================================================

/*
CREATE TABLE IF NOT EXISTS documentos_ocr (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('carta_porte', 'factura', 'pod', 'general')),
  datos JSONB NOT NULL,
  texto_completo TEXT,
  archivo_nombre VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsqueda y performance
CREATE INDEX idx_documentos_ocr_tipo ON documentos_ocr(tipo);
CREATE INDEX idx_documentos_ocr_usuario_id ON documentos_ocr(usuario_id);
CREATE INDEX idx_documentos_ocr_created_at ON documentos_ocr(created_at DESC);
CREATE INDEX idx_documentos_ocr_deleted_at ON documentos_ocr(deleted_at);
CREATE INDEX idx_documentos_ocr_datos ON documentos_ocr USING GIN(datos);

-- RLS Policy for authenticated users to see only their documents
ALTER TABLE documentos_ocr ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own documents"
  ON documentos_ocr FOR SELECT
  USING (usuario_id = auth.uid());

CREATE POLICY "Users can create documents"
  ON documentos_ocr FOR INSERT
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Users can update their own documents"
  ON documentos_ocr FOR UPDATE
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_documentos_ocr_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_documentos_ocr_timestamp_trigger
  BEFORE UPDATE ON documentos_ocr
  FOR EACH ROW
  EXECUTE FUNCTION update_documentos_ocr_timestamp();
*/
