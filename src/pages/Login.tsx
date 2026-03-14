import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../hooks/AuthContext'
import { Truck, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { tokens } from '../lib/tokens'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, getRutaInicial } = useAuthContext()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate(getRutaInicial())
    } catch (err: any) {
      setError(
        err.message === 'Invalid login credentials'
          ? 'Correo o contraseña incorrectos'
          : err.message || 'Error al iniciar sesión'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: tokens.effects.gradientBg }}
    >
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-1/4 -left-20 w-96 h-96 rounded-full blur-3xl"
          style={{ background: `${tokens.colors.primary}0d` }}
        />
        <div
          className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full blur-3xl"
          style={{ background: `${tokens.colors.primary}0d` }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl border mb-4"
            style={{
              background: `${tokens.colors.primary}1a`,
              borderColor: `${tokens.colors.primary}33`,
            }}
          >
            <Truck className="w-8 h-8" style={{ color: tokens.colors.primary }} />
          </div>
          <h1
            className="text-3xl font-bold"
            style={{
              color: tokens.colors.textPrimary,
              fontFamily: tokens.fonts.heading,
              letterSpacing: '0.05em',
            }}
          >
            Loma<span style={{ color: tokens.colors.primary }}>HUB</span>27
          </h1>
          <p
            className="mt-2 text-sm"
            style={{
              color: tokens.colors.textSecondary,
              fontFamily: tokens.fonts.body,
            }}
          >
            CRM + TMS + Torre de Control
          </p>
        </div>

        {/* Login Card */}
        <div
          className="rounded-xl border p-8"
          style={{
            background: tokens.effects.glassmorphism.background,
            backdropFilter: tokens.effects.glassmorphism.backdropFilter,
            borderColor: tokens.effects.glassmorphism.border,
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div
                className="flex items-center gap-3 p-3 rounded-lg border"
                style={{
                  background: `${tokens.colors.red}1a`,
                  borderColor: `${tokens.colors.red}33`,
                }}
              >
                <AlertCircle className="w-5 h-5 shrink-0" style={{ color: tokens.colors.red }} />
                <p className="text-sm" style={{ color: tokens.colors.red, fontFamily: tokens.fonts.body }}>
                  {error}
                </p>
              </div>
            )}

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{
                  color: tokens.colors.textSecondary,
                  fontFamily: tokens.fonts.body,
                }}
              >
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors focus:ring-2"
                style={{
                  background: tokens.colors.bgHover,
                  border: `1px solid ${tokens.colors.border}`,
                  color: tokens.colors.textPrimary,
                  fontFamily: tokens.fonts.body,
                  // @ts-expect-error CSS custom property
                  '--tw-ring-color': tokens.colors.primary,
                }}
                placeholder="tu@empresa.com"
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{
                  color: tokens.colors.textSecondary,
                  fontFamily: tokens.fonts.body,
                }}
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors focus:ring-2 pr-12"
                  style={{
                    background: tokens.colors.bgHover,
                    border: `1px solid ${tokens.colors.border}`,
                    color: tokens.colors.textPrimary,
                    fontFamily: tokens.fonts.body,
                    // @ts-expect-error CSS custom property
                    '--tw-ring-color': tokens.colors.primary,
                  }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: tokens.colors.textMuted }}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: tokens.colors.primary,
                color: '#fff',
                fontFamily: tokens.fonts.body,
                boxShadow: tokens.effects.glowPrimary,
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Ingresando...
                </span>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>
        </div>

        <p
          className="text-center text-xs mt-6"
          style={{
            color: tokens.colors.textMuted,
            fontFamily: tokens.fonts.body,
          }}
        >
          LomaHUB27 v2.0 — Sistema de gestión integral
        </p>
      </div>
    </div>
  )
}
