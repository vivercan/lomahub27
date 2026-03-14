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
  const [googleLoading, setGoogleLoading] = useState(false)
  const { login, loginWithGoogle, getRutaInicial } = useAuthContext()
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

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: tokens.colors.border }} />
            <span
              className="text-xs"
              style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body }}
            >
              o continúa con
            </span>
            <div className="flex-1 h-px" style={{ background: tokens.colors.border }} />
          </div>

          {/* Google Sign-In */}
          <button
            type="button"
            disabled={googleLoading || loading}
            onClick={async () => {
              setError('')
              setGoogleLoading(true)
              try {
                await loginWithGoogle()
              } catch (err: any) {
                setError(err.message || 'Error al iniciar sesión con Google')
                setGoogleLoading(false)
              }
            }}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border"
            style={{
              background: tokens.colors.bgHover,
              borderColor: tokens.colors.border,
              color: tokens.colors.textPrimary,
              fontFamily: tokens.fonts.body,
            }}
          >
            {googleLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Conectando…
              </span>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Iniciar sesión con Google
              </>
            )}
          </button>
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
