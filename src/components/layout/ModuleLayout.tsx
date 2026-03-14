import { tokens } from '../../lib/tokens'
import { Sidebar } from './Sidebar'

interface ModuleLayoutProps {
  titulo: string
  subtitulo?: string
  acciones?: React.ReactNode
  children: React.ReactNode
}

export function ModuleLayout({ titulo, subtitulo, acciones, children }: ModuleLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: tokens.effects.gradientBg }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header del módulo */}
        <div
          className="border-b px-6 py-4 flex items-center justify-between shrink-0"
          style={{
            background: tokens.colors.bgCard,
            borderColor: tokens.colors.border,
          }}
        >
          <div>
            <h1
              className="text-lg font-bold"
              style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading }}
            >
              {titulo}
            </h1>
            {subtitulo && (
              <p className="text-sm" style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body }}>
                {subtitulo}
              </p>
            )}
          </div>
          {acciones && <div className="flex items-center gap-2">{acciones}</div>}
        </div>

        {/* Contenido del módulo */}
        <div className="flex-1 overflow-y-auto p-6" style={{ fontFamily: tokens.fonts.body }}>
          {children}
        </div>
      </div>
    </div>
  )
}
