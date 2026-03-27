/**
 * useExport Hook - PDF and CSV Export Functionality
 *
 * Provides a clean API for exporting dashboard data to CSV and PDF formats.
 * Uses native browser APIs and window.print() for PDF generation.
 * Supports formatted output with Mexican peso currency and es-MX date formatting.
 */

import { useState, useCallback } from 'react'

/**
 * Format a number as Mexican peso currency (MXN)
 * @param val - Numeric value to format
 * @returns Formatted string like "$ 1,234.56"
 */
export const formatMXN = (val: number): string => {
  if (val == null) return '$ 0.00'
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(val)
}

/**
 * Format a date for es-MX locale with time
 * @param date - Date object or ISO string
 * @param includeTime - Whether to include time (default: false)
 * @returns Formatted date string like "27 de marzo de 2026"
 */
export const formatDateEsMX = (
  date: Date | string,
  includeTime: boolean = false
): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  if (!(d instanceof Date) || isNaN(d.getTime())) {
    return 'Fecha inválida'
  }

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(includeTime && {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return d.toLocaleDateString('es-MX', options)
}

/**
 * Escape CSV field values (handle commas, quotes, newlines)
 * @param field - Value to escape
 * @returns Properly escaped CSV field
 */
const escapeCSVField = (field: any): string => {
  if (field == null) return ''
  const str = String(field)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Convert array of objects to CSV string
 * @param data - Array of objects to convert
 * @returns CSV formatted string
 */
const convertToCSV = (data: Record<string, any>[]): string => {
  if (!data || data.length === 0) {
    return ''
  }

  // Get headers from first object
  const headers = Object.keys(data[0])
  const headerRow = headers.map(escapeCSVField).join(',')

  // Convert each row
  const rows = data.map(row =>
    headers.map(header => escapeCSVField(row[header])).join(',')
  )

  return [headerRow, ...rows].join('\n')
}

/**
 * Download a string as a file
 * @param content - String content to download
 * @param filename - Name of file to download as
 * @param mimeType - MIME type of content (default: text/plain)
 */
const downloadFile = (
  content: string,
  filename: string,
  mimeType: string = 'text/plain'
): void => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export interface UseExportReturn {
  /** Export data array to CSV file */
  exportCSV: (data: Record<string, any>[], filename: string) => Promise<void>
  /** Trigger PDF export via window.print() */
  exportPDF: (title?: string) => void
  /** Whether an export operation is currently in progress */
  isExporting: boolean
}

/**
 * Custom hook for PDF and CSV export functionality
 *
 * Usage:
 * ```
 * const { exportCSV, exportPDF, isExporting } = useExport()
 *
 * const handleExportCSV = async () => {
 *   await exportCSV(tableData, 'report.csv')
 * }
 *
 * const handleExportPDF = () => {
 *   exportPDF('Mi Reporte')
 * }
 * ```
 *
 * @returns Object containing export functions and loading state
 */
export const useExport = (): UseExportReturn => {
  const [isExporting, setIsExporting] = useState(false)

  /**
   * Export data to CSV format
   * Generates a downloadable CSV file with proper escaping
   */
  const exportCSV = useCallback(
    async (data: Record<string, any>[], filename: string): Promise<void> => {
      try {
        setIsExporting(true)

        // Validate inputs
        if (!Array.isArray(data)) {
          throw new Error('exportCSV: data must be an array')
        }

        if (!filename || typeof filename !== 'string') {
          throw new Error('exportCSV: filename must be a non-empty string')
        }

        // Ensure filename has .csv extension
        const csvFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`

        // Convert to CSV and download
        const csv = convertToCSV(data)
        downloadFile(csv, csvFilename, 'text/csv;charset=utf-8;')

        setIsExporting(false)
      } catch (error) {
        console.error('Error exporting CSV:', error)
        setIsExporting(false)
        throw error
      }
    },
    []
  )

  /**
   * Export current page/section to PDF via window.print()
   * User selects PDF printer and can configure print settings
   *
   * Make sure your page includes print CSS rules for clean output:
   * ```css
   * @media print {
   *   .no-print { display: none; }
   *   body { background: white; }
   *   .print-title { font-size: 20px; font-weight: bold; }
   * }
   * ```
   */
  const exportPDF = useCallback((title?: string): void => {
    try {
      // If title provided, inject it into a temporary print header
      if (title) {
        const printTitle = document.createElement('div')
        printTitle.className = 'print-title'
        printTitle.textContent = title
        printTitle.style.cssText = `
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 24px;
          color: #3B6CE7;
          page-break-after: avoid;
        `

        // Insert at top of document for printing
        const body = document.body
        body.insertBefore(printTitle, body.firstChild)

        // Trigger print after a brief delay to ensure rendering
        setTimeout(() => {
          window.print()
          // Remove the temporary title after print dialog closes
          printTitle.remove()
        }, 100)
      } else {
        // Just trigger print directly
        window.print()
      }
    } catch (error) {
      console.error('Error exporting PDF:', error)
      throw error
    }
  }, [])

  return {
    exportCSV,
    exportPDF,
    isExporting
  }
}

/**
 * RECOMMENDED: Add this CSS to your global styles for better PDF/print output
 *
 * @media print {
 *   body {
 *     background: white !important;
 *     color: black !important;
 *   }
 *
 *   .no-print {
 *     display: none !important;
 *   }
 *
 *   .print-only {
 *     display: block !important;
 *   }
 *
 *   .print-title {
 *     font-size: 24px;
 *     font-weight: 700;
 *     margin-bottom: 24px;
 *     color: #3B6CE7;
 *     page-break-after: avoid;
 *   }
 *
 *   a {
 *     text-decoration: none;
 *     color: inherit;
 *   }
 *
 *   img {
 *     max-width: 100%;
 *   }
 *
 *   table {
 *     width: 100%;
 *     border-collapse: collapse;
 *   }
 *
 *   th, td {
 *     padding: 8px;
 *     border: 1px solid #333;
 *     text-align: left;
 *   }
 * }
 */
