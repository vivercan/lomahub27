import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { tokens } from '../../lib/tokens'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, totalItems, pageSize, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)

  const btnStyle = (disabled: boolean, active?: boolean) => ({
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    border: active ? `2px solid ${tokens.colors.primary}` : `1px solid ${tokens.colors.border}`,
    background: active ? tokens.colors.primary : 'transparent',
    color: active ? '#fff' : disabled ? tokens.colors.textMuted : tokens.colors.textPrimary,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    fontFamily: tokens.fonts.body,
    fontSize: '13px',
    fontWeight: active ? 700 : 500,
    transition: '0.15s',
  })

  const pages: (number | string)[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (currentPage > 3) pages.push('...')
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i)
    }
    if (currentPage < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', fontFamily: tokens.fonts.body }}>
      <span style={{ fontSize: '13px', color: tokens.colors.textSecondary }}>
        {start}-{end} de {totalItems.toLocaleString('es-MX')}
      </span>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <button onClick={() => onPageChange(1)} disabled={currentPage === 1} style={btnStyle(currentPage === 1)}>
          <ChevronsLeft size={16} />
        </button>
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} style={btnStyle(currentPage === 1)}>
          <ChevronLeft size={16} />
        </button>
        {pages.map((p, i) =>
          typeof p === 'string' ? (
            <span key={`dots-${i}`} style={{ padding: '0 4px', color: tokens.colors.textMuted }}>...</span>
          ) : (
            <button key={p} onClick={() => onPageChange(p)} style={btnStyle(false, p === currentPage)}>
              {p}
            </button>
          )
        )}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} style={btnStyle(currentPage === totalPages)}>
          <ChevronRight size={16} />
        </button>
        <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} style={btnStyle(currentPage === totalPages)}>
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  )
}
