// ===================================================================
// Toast notification system — V50 (26/Abr/2026)
// Reemplaza alert()/confirm() nativos. Singleton stack en top-right.
// Uso:
//   import { toast } from '@/components/ui/Toast'
//   toast.success('Lead guardado')
//   toast.error('Error: ' + msg)
//   toast.info('...')
//   toast.warn('...')
//
// IMPORTANTE: Montar <ToastContainer /> UNA vez en App.tsx (root).
// ===================================================================
import { useEffect, useState } from 'react'
import { tokens } from '../../lib/tokens'

type ToastType = 'success' | 'error' | 'info' | 'warn'

interface ToastItem {
  id: number
  type: ToastType
  message: string
  duration: number
}

type Listener = (toasts: ToastItem[]) => void

class ToastStore {
  private items: ToastItem[] = []
  private listeners: Listener[] = []
  private nextId = 1

  push(type: ToastType, message: string, duration = 4000) {
    const id = this.nextId++
    this.items = [...this.items, { id, type, message, duration }]
    this.emit()
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration)
    }
  }

  dismiss(id: number) {
    this.items = this.items.filter(t => t.id !== id)
    this.emit()
  }

  subscribe(fn: Listener) {
    this.listeners.push(fn)
    return () => { this.listeners = this.listeners.filter(l => l !== fn) }
  }

  private emit() {
    this.listeners.forEach(l => l([...this.items]))
  }
}

const store = new ToastStore()

export const toast = {
  success: (msg: string, duration?: number) => store.push('success', msg, duration),
  error:   (msg: string, duration?: number) => store.push('error', msg, duration ?? 6000),
  info:    (msg: string, duration?: number) => store.push('info', msg, duration),
  warn:    (msg: string, duration?: number) => store.push('warn', msg, duration),
}

const COLORS: Record<ToastType, { bg: string; bd: string; ico: string; label: string }> = {
  success: { bg: 'linear-gradient(180deg,#34D399,#10B981 50%,#059669)', bd: '#10B981', ico: '✓', label: 'Éxito' },
  error:   { bg: 'linear-gradient(180deg,#F87171,#EF4444 50%,#DC2626)', bd: '#EF4444', ico: '✕', label: 'Error' },
  warn:    { bg: 'linear-gradient(180deg,#FBBF24,#F59E0B 50%,#D97706)', bd: '#F59E0B', ico: '!', label: 'Aviso' },
  info:    { bg: 'linear-gradient(180deg,#60A5FA,#3B82F6 50%,#2563EB)', bd: '#3B82F6', ico: 'i', label: 'Info' },
}

export function ToastContainer() {
  const [items, setItems] = useState<ToastItem[]>([])
  useEffect(() => store.subscribe(setItems), [])
  if (items.length === 0) return null
  return (
    <div style={{
      position: 'fixed', top: 88, right: 24, zIndex: 99999,
      display: 'flex', flexDirection: 'column', gap: 10,
      pointerEvents: 'none',
    }}>
      {items.map(t => {
        const c = COLORS[t.type]
        return (
          <div key={t.id} style={{
            pointerEvents: 'auto',
            minWidth: 280, maxWidth: 420,
            background: '#FFFFFF',
            borderLeft: `4px solid ${c.bd}`,
            borderRadius: 10,
            boxShadow: '0 4px 12px rgba(15,23,42,0.10), 0 8px 24px rgba(15,23,42,0.08)',
            padding: '12px 14px',
            display: 'flex', gap: 12, alignItems: 'flex-start',
            fontFamily: tokens.fonts.body,
            animation: 'lhub-toast-in 0.2s ease-out',
          }}>
            <span style={{
              flexShrink: 0, width: 26, height: 26, borderRadius: '50%',
              background: c.bg, color: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 800,
              boxShadow: `0 1px 0 rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.18)`,
            }}>{c.ico}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: c.bd, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{c.label}</div>
              <div style={{ fontSize: 13, color: '#0F172A', marginTop: 2, wordBreak: 'break-word' }}>{t.message}</div>
            </div>
            <button onClick={() => store.dismiss(t.id)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#94A3B8', fontSize: 18, padding: 0, lineHeight: 1,
            }}>×</button>
          </div>
        )
      })}
      <style>{`@keyframes lhub-toast-in { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }`}</style>
    </div>
  )
}
