import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const FALLBACK_RATE = 17.88

/**
 * Hook unificado para tipo de cambio USD/MXN.
 * 1) Intenta leer de Supabase configuracion.tipo_cambio_usd_mxn
 * 2) Fallback a open.er-api.com/v6/latest/USD
 * 3) Fallback final: FALLBACK_RATE constante
 *
 * Devuelve { rate, loading, fallback, effective }.
 *  - rate: valor real obtenido o null si todo falló
 *  - effective: rate ?? FALLBACK_RATE (siempre numérico)
 */
export function useFxRate() {
  const [rate, setRate] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const fetchRate = async () => {
      try {
        const { data, error } = await supabase
          .from('configuracion')
          .select('valor')
          .eq('clave', 'tipo_cambio_usd_mxn')
          .maybeSingle()
        if (active && !error && data?.valor) {
          setRate(parseFloat(data.valor))
          setLoading(false)
          return
        }
      } catch { /* fallthrough */ }
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD')
        const json = await res.json()
        if (active && json?.rates?.MXN) {
          setRate(json.rates.MXN)
          setLoading(false)
          return
        }
      } catch { /* fallthrough */ }
      if (active) {
        setRate(null)
        setLoading(false)
      }
    }
    fetchRate()
    return () => { active = false }
  }, [])

  return {
    rate,
    loading,
    fallback: FALLBACK_RATE,
    effective: rate ?? FALLBACK_RATE,
  }
}
