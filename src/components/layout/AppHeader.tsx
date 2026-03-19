// src/components/layout/AppHeader.tsx
// Header 3D cristal — Design System LomaHUB27 (Notion p.18)
// APROBADO POR JJ 18/Mar/2026

import { useEffect, useState } from 'react'

interface AppHeaderProps {
  onLogout: () => void
  userName?: string
  userRole?: string
}

export default function AppHeader({ onLogout, userName, userRole }: AppHeaderProps) {
  const [fxRate, setFxRate] = useState<string>('17.69')
  const [currentDate, setCurrentDate] = useState('')
  const [weekNumber, setWeekNumber] = useState('')

  useEffect(() => {
    const now = new Date()
    setCurrentDate(now.toLocaleDateString('es-MX', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }))
    const start = new Date(now.getFullYear(), 0, 1)
    const diff = now.getTime() - start.getTime()
    setWeekNumber('W' + Math.ceil((diff / 604800000) + 1))
    fetchFx()
    const iv = setInterval(fetchFx, 5 * 60 * 60 * 1000)
    return () => clearInterval(iv)
  }, [])

  async function fetchFx() {
    try {
      const r = await fetch('https://open.er-api.com/v6/latest/USD')
      const d = await r.json()
      if (d?.rates?.MXN) setFxRate(d.rates.MXN.toFixed(2))
    } catch { /* fallback */ }
  }
  return (
    <header className="app-header" style={{
      position: 'relative', width: '100%', height: '112px',
      background: 'linear-gradient(180deg, #111116 0%, #0a0a0e 25%, #040408 55%, #060609 90%, #0a0a0e 100%)',
      borderBottom: '3px solid #1a1a22',
      boxShadow: '0 1px 0 rgba(255,255,255,0.12) inset, 0 3px 0 rgba(255,255,255,0.04) inset, 0 -2px 0 rgba(0,0,0,0.5) inset, 0 -6px 12px rgba(0,0,0,0.25) inset, 0 3px 0 rgba(232,97,26,0.30), 0 4px 0 rgba(20,20,28,0.99), 0 5px 0 rgba(15,15,22,0.95), 0 6px 0 rgba(10,10,18,0.90), 0 7px 0 rgba(8,8,14,0.85), 0 8px 2px rgba(5,5,10,0.80), 0 10px 8px rgba(0,0,0,0.6), 0 14px 20px rgba(0,0,0,0.5), 0 20px 40px rgba(0,0,0,0.35), 0 30px 80px rgba(0,0,0,0.20)',
      zIndex: 50, fontFamily: "'Montserrat', sans-serif", WebkitFontSmoothing: 'antialiased',
    }}>
      {/* Reflejo cristal superior */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 20%, rgba(255,255,255,0.01) 40%, transparent 100%)',
        borderTop: '1px solid rgba(255,255,255,0.14)', pointerEvents: 'none', zIndex: 1,
      }} />

      <div style={{
        position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center',
        height: '100%', padding: '0 36px', gap: '24px',
      }}>
        {/* Logo LomaHUB27 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%', height: '2px', background: 'linear-gradient(90deg, rgba(120,120,130,0.3), rgba(232,97,26,0.6))', marginBottom: '4px' }} />
          <span style={{ fontWeight: 800, fontStyle: 'italic', fontSize: '30px', letterSpacing: '-2px', lineHeight: 1 }}>
            <span style={{ color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Loma</span>
            <span style={{ color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>HUB</span>
            <span style={{ color: '#E8611A', textShadow: '0 0 12px rgba(232,97,26,0.35)' }}>27</span>
          </span>
          <div style={{ width: '100%', height: '3px', background: 'linear-gradient(90deg, rgba(120,120,130,0.3), rgba(232,97,26,0.6))', marginTop: '2px' }} />
          <span style={{ fontWeight: 400, fontStyle: 'italic', fontSize: '9px', color: 'rgba(190,190,190,0.55)', marginTop: '2px' }}>Future Experience</span>
        </div>

        <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.08)' }} />

        {/* Fecha */}
        <span style={{ fontWeight: 700, fontSize: '13.5px', color: '#fff', textTransform: 'capitalize' }}>{currentDate}</span>

        <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.08)' }} />

        {/* Semana */}
        <span style={{ fontWeight: 800, fontSize: '13px', color: '#E8611A' }}>{weekNumber}</span>

        <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.08)' }} />
        {/* FX Rate */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#2ECC71', boxShadow: '0 0 6px rgba(46,204,113,0.5)' }} />
          <span style={{ fontWeight: 600, fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>USD/MXN</span>
          <span style={{ fontWeight: 800, fontSize: '13px', color: '#2ECC71' }}>${fxRate}</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Usuario + Rol */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#fff' }}>{userName || 'Usuario'}</div>
            <div style={{ fontWeight: 600, fontSize: '11px', color: '#E8611A', textTransform: 'uppercase' }}>{userRole || 'admin'}</div>
          </div>

          {/* Boton Power */}
          <button onClick={onLogout} style={{
            width: '34px', height: '34px', borderRadius: '50%',
            border: '2px solid #E8611A', background: 'rgba(232,97,26,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 0 10px rgba(232,97,26,0.20)',
          }} title="Cerrar sesion">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16,17 21,12 16,7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Linea naranja inferior */}
      <div style={{
        position: 'absolute', bottom: '-1px', left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, #E8611A 20%, #E8611A 80%, transparent 100%)',
        opacity: 0.6, zIndex: 3,
      }} />
    </header>
  )
}
