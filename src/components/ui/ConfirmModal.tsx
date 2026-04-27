// ConfirmModal — V53 27/Abr/2026
// Reemplaza window.confirm() con modal estilizado.
// Uso: import { confirmDialog } from '@/components/ui/ConfirmModal'
//      const ok = await confirmDialog({ message: '¿Eliminar?', danger: true })
//      if (!ok) return
//
// IMPORTANTE: Montar <ConfirmContainer /> UNA vez en App.tsx (root).
import { useEffect, useState } from 'react'
import { tokens } from '../../lib/tokens'

interface ConfirmOpts {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

type State = { opts: ConfirmOpts | null }

class ConfirmStore {
  private listeners: ((s: State) => void)[] = []
  private resolver?: (v: boolean) => void

  ask(opts: ConfirmOpts): Promise<boolean> {
    return new Promise<boolean>((res) => {
      this.resolver = res
      this.listeners.forEach(l => l({ opts }))
    })
  }

  resolve(v: boolean) {
    if (this.resolver) {
      this.resolver(v)
      this.resolver = undefined
    }
    this.listeners.forEach(l => l({ opts: null }))
  }

  subscribe(fn: (s: State) => void) {
    this.listeners.push(fn)
    return () => { this.listeners = this.listeners.filter(l => l !== fn) }
  }
}

const store = new ConfirmStore()

export function confirmDialog(opts: ConfirmOpts): Promise<boolean> {
  return store.ask(opts)
}

export function ConfirmContainer() {
  const [state, setState] = useState<State>({ opts: null })
  useEffect(() => store.subscribe(setState), [])

  if (!state.opts) return null
  const o = state.opts

  return (
    <div
      onClick={() => store.resolve(false)}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
        zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFFFF', borderRadius: 14, padding: 24, maxWidth: 420, width: '90%',
          boxShadow: '0 20px 50px rgba(15,23,42,0.30)', fontFamily: tokens.fonts.body,
          animation: 'lhub-toast-in 0.18s ease-out',
        }}
      >
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
          {o.title || 'Confirmar acción'}
        </h3>
        <p style={{ margin: '12px 0 20px', color: '#475569', fontSize: 13, lineHeight: 1.5 }}>
          {o.message}
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={() => store.resolve(false)}
            style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid #E2E8F0',
              background: '#FFFFFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {o.cancelLabel || 'Cancelar'}
          </button>
          <button
            onClick={() => store.resolve(true)}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none',
              background: o.danger
                ? 'linear-gradient(180deg,#EF4444,#DC2626)'
                : 'linear-gradient(180deg,#3B82F6,#2563EB)',
              color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              boxShadow: o.danger
                ? '0 2px 6px rgba(239,68,68,0.35)'
                : '0 2px 6px rgba(59,130,246,0.35)',
            }}
          >
            {o.confirmLabel || 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}
