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

/**
 * Normalizes and formats a product ID code.
 * Strips '#' and spaces, extracts numeric digits and automatically adds the 'SP-' prefix.
 * e.g., "999" -> "SP-999"
 * e.g., "#sp-999" -> "SP-999"
 * e.g., "SP-999" -> "SP-999"
 * e.g., "sp999" -> "SP-999"
 */
export function formatProductCode(rawCode) {
  if (!rawCode) return ''
  const str = String(rawCode).trim()
  // Extract all numeric digits
  const digits = str.replace(/\D/g, '')
  if (digits) {
    return `SP-${digits}`
  }
  // Fallback for non-digit codes if any
  const cleaned = str.replace(/^#+/g, '').replace(/^sp-?/i, '').trim()
  return cleaned ? `SP-${cleaned}` : ''
}

/**
 * Extracts ONLY digits from a product code for numeric-only input fields.
 * e.g., "SP-999" -> "999"
 * e.g., "#sp-999" -> "999"
 * e.g., "999" -> "999"
 */
export function extractProductCodeDigits(rawCode) {
  if (!rawCode) return ''
  return String(rawCode).replace(/\D/g, '')
}

/**
 * Comprehensive product search matching for names, categories, and codes.
 * Matches when user searches numeric digits (e.g. "999"), prefix format ("SP-999" or "sp-999"),
 * or partial name/category text.
 */
export function matchesProductSearch(product, rawQuery) {
  if (!rawQuery || !rawQuery.trim()) return true
  const q = rawQuery.trim().toLowerCase()
  if (!product) return false

  // 1. Direct name match
  if (product.name && product.name.toLowerCase().includes(q)) return true

  // 2. Category match
  if (product.category && product.category.toLowerCase().includes(q)) return true

  // 3. Notes match
  if (product.notes && product.notes.toLowerCase().includes(q)) return true

  // 4. Product code / ID match
  if (product.code) {
    const rawCode = String(product.code).toLowerCase()
    // Direct substring match
    if (rawCode.includes(q)) return true

    // Alphanumeric clean match (e.g. "sp999" matches "sp-999" or "SP-999")
    const cleanCode = rawCode.replace(/[^a-z0-9]/g, '')
    const cleanQ = q.replace(/[^a-z0-9]/g, '')
    if (cleanCode && cleanQ && (cleanCode.includes(cleanQ) || cleanQ.includes(cleanCode))) return true

    // Numeric digits match (e.g. searching "999" matches "SP-999" or "#sp-999")
    const codeDigits = rawCode.replace(/\D/g, '')
    const qDigits = q.replace(/\D/g, '')
    if (codeDigits && qDigits && (codeDigits.includes(qDigits) || qDigits.includes(codeDigits))) return true
  }

  // 5. Product compatibility ID match (e.g. Mongo/Convex _id)
  if (product.id && typeof product.id === 'string' && product.id.toLowerCase().includes(q)) return true

  return false
}

