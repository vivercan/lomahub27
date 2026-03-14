import { tokens } from '../../lib/tokens'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Column<T = any> {
  key: string
  label: string
  render?: (row: T) => React.ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface DataTableProps<T = any> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (row: T) => void
  emptyMessage?: string
  loading?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DataTable<T = any>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'Sin datos',
  loading = false,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: tokens.colors.primary, borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: `1px solid ${tokens.colors.border}` }}>
            {columns.map(col => (
              <th
                key={col.key}
                className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-left"
                style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body, width: col.width, textAlign: col.align || 'left' }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-8" style={{ color: tokens.colors.textMuted }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={i}
                className={`transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                style={{ borderBottom: `1px solid ${tokens.colors.border}` }}
                onClick={() => onRowClick?.(row)}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = tokens.colors.bgHover }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                {columns.map(col => (
                  <td
                    key={col.key}
                    className="px-4 py-3 text-sm"
                    style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body, textAlign: col.align || 'left' }}
                  >
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '-')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
