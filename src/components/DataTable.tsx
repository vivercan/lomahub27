import type { ReactNode, CSSProperties } from 'react'
import { tokens } from '../lib/tokens'

interface Column<T> {
  key: string
  header: string
  render?: (row: T) => ReactNode
  width?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (row: T) => void
  emptyMessage?: string
  style?: CSSProperties
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'Sin datos',
  style,
}: DataTableProps<T>) {
  const thStyle: React.CSSProperties = {
    padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: 600,
    color: tokens.colors.textMuted,
    fontFamily: tokens.fonts.heading,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    background: tokens.colors.bgHover,
  }
  const tdStyle: React.CSSProperties = {
    padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
    fontSize: '14px',
    fontFamily: tokens.fonts.body,
    color: tokens.colors.textSecondary,
    verticalAlign: 'middle',
  }

  if (data.length === 0) {
    return (
      <div style={{ padding: tokens.spacing.xxl, textAlign: 'center', color: tokens.colors.textMuted }}>
        {emptyMessage}
      </div>
    )
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', ...style }}>
      <thead>
        <tr>
          {columns.map(col => (
            <th key={col.key} style={{ ...thStyle, width: col.width }}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr
            key={i}
            onClick={() => onRowClick?.(row)}
            style={{
              borderBottom: `1px solid ${tokens.colors.border}`,
              cursor: onRowClick ? 'pointer' : 'default',
            }}
          >
            {columns.map(col => (
              <td key={col.key} style={tdStyle}>
                {col.render ? col.render(row) : String(row[col.key] ?? '')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
