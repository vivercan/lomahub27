import React from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { tokens } from '../lib/tokens'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallbackMessage?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error.message, info.componentStack)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column' as const,
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
          gap: '16px',
          fontFamily: tokens.fonts.body,
          color: tokens.colors.textSecondary,
        }}>
          <AlertTriangle size={48} style={{ color: tokens.colors.yellow }} />
          <h2 style={{
            fontFamily: tokens.fonts.heading,
            fontSize: '20px',
            fontWeight: 700,
            color: tokens.colors.textPrimary,
            margin: 0,
          }}>
            {this.props.fallbackMessage || 'Algo salió mal'}
          </h2>
          <p style={{ fontSize: '14px', maxWidth: '400px', textAlign: 'center' as const, margin: 0 }}>
            {this.state.error?.message || 'Error inesperado en este módulo'}
          </p>
          <button
            onClick={this.handleRetry}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              background: tokens.colors.primary,
              color: '#fff',
              fontFamily: tokens.fonts.heading,
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: '0.2s',
            }}
          >
            <RefreshCw size={16} /> Reintentar
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
