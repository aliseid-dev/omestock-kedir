import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import * as XLSX from 'xlsx'

/**
 * Combines Tailwind CSS classes safely
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as Ethiopian Birr (ETB) currency
 */
export function formatCurrency(amount, currency = 'ETB') {
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
  return `${formatted} ETB`
}

/**
 * Formats a date or timestamp
 */
export function formatDate(date) {
  if (!date) return '-'
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Export data array to an Excel (.xlsx) file
 */
export function exportToExcel(data, fileName = 'report') {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')
    
    // Auto-fit column widths
    const maxProps = {}
    data.forEach(row => {
      Object.keys(row).forEach(key => {
        const valStr = String(row[key] ?? '')
        maxProps[key] = Math.max(maxProps[key] || 10, key.length, valStr.length)
      })
    })
    worksheet['!cols'] = Object.keys(maxProps).map(key => ({ wch: Math.min(maxProps[key] + 3, 40) }))

    XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`)
    return true
  } catch (err) {
    console.error('Failed to export to Excel:', err)
    return false
  }
}

/**
 * Generates a unique 6-digit alphanumeric organization code (uppercase letters and numbers, e.g. A7X9M2)
 */
export function generateCompanyCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

