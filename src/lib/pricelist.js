import * as XLSX from 'xlsx-js-style'

const CATEGORY_MAP = {
  WH: 'Water Heaters', REF: 'Refrigerators', AC: 'Air Conditioners',
  DF: 'Deep Freezers', WM: 'Washing Machines', CE: 'Televisions',
  MWO: 'Microwaves', KA: 'Kitchen Appliances',
}
const categoryFor = (sheet) => {
  const key = sheet.trim().split(/\s+/)[0].toUpperCase()
  return CATEGORY_MAP[key] || sheet.trim()
}
const norm = (s) => String(s == null ? '' : s).trim().toLowerCase()
const num = (v) => {
  if (v == null || v === '') return null
  const n = Number(String(v).replace(/[^0-9.\-]/g, ''))
  return isFinite(n) ? Math.round(n) : null
}
const DESC_HEADERS = ['features', 'segment', 'sub segment', 'capacity (in ltrs)', 'capacity', 'classifications', 'classification', 'size', 'status', 'fighter model']

// Haier's monthly multi-sheet price list: category per sheet, columns MODEL/MRP/DP/NLC.
export function parseHaierWorkbook(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array' })
  const products = []
  for (const sheetName of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '' })
    let hIdx = -1
    for (let i = 0; i < Math.min(rows.length, 8); i++) {
      const cells = rows[i].map(norm)
      if (cells.some((c) => c.includes('model')) && cells.some((c) => c.includes('mrp'))) { hIdx = i; break }
    }
    if (hIdx === -1) continue
    const header = rows[hIdx].map(norm)
    const modelCol = header.findIndex((c) => c.includes('model'))
    const mrpCol = header.findIndex((c) => c === 'mrp')
    const dpCol = header.findIndex((c) => c === 'dp')
    const nlcCol = header.findIndex((c) => c === 'nlc')
    let descCol = -1
    for (const cand of DESC_HEADERS) {
      const idx = header.findIndex((c) => c === cand)
      if (idx !== -1 && idx !== modelCol) { descCol = idx; break }
    }
    const category = categoryFor(sheetName)
    for (let r = hIdx + 1; r < rows.length; r++) {
      const row = rows[r]
      const model = String(row[modelCol] == null ? '' : row[modelCol]).trim()
      const mrp = num(row[mrpCol]); const dp = num(row[dpCol]); const nlc = num(row[nlcCol])
      if (!model || (mrp == null && dp == null)) continue
      products.push({ category, model, description: descCol > -1 ? String(row[descCol] || '').trim() : '', mrp, dp, nlc })
    }
  }
  return products
}

// Standard paste-in template: columns Category | Model | Description | MRP | DP | NLC
export function parseStandardTemplate(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array' })
  const products = []
  for (const sheetName of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '' })
    let hIdx = -1
    for (let i = 0; i < Math.min(rows.length, 5); i++) {
      if (rows[i].map(norm).some((c) => c.includes('model'))) { hIdx = i; break }
    }
    if (hIdx === -1) continue
    const header = rows[hIdx].map(norm)
    const find = (names) => header.findIndex((c) => names.some((n) => c === n || c.includes(n)))
    const catCol = find(['category'])
    const modelCol = find(['model'])
    const descCol = find(['description', 'desc'])
    const mrpCol = header.findIndex((c) => c === 'mrp' || c.includes('mrp'))
    const dpCol = header.findIndex((c) => c === 'dp' || c.includes('dealer'))
    const nlcCol = header.findIndex((c) => c === 'nlc' || c.includes('cost'))
    for (let r = hIdx + 1; r < rows.length; r++) {
      const row = rows[r]
      const model = String(row[modelCol] == null ? '' : row[modelCol]).trim()
      if (!model) continue
      products.push({
        category: catCol > -1 ? String(row[catCol] || '').trim() || 'General' : 'General',
        model,
        description: descCol > -1 ? String(row[descCol] || '').trim() : '',
        mrp: num(row[mrpCol]), dp: num(row[dpCol]), nlc: num(row[nlcCol]),
      })
    }
  }
  return products
}

// Download a blank template for non-Haier brands.
export function downloadTemplate() {
  const rows = [
    ['Category', 'Model', 'Description', 'MRP', 'DP', 'NLC'],
    ['Stabilizers', 'VG-EXAMPLE-400', 'Example row — delete me', 2200, 1800, 1500],
  ]
  const ws = XLSX.utils.aoa_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Price List')
  XLSX.writeFile(wb, 'price-list-template.xlsx')
}

// ---- flexible import: keep EVERY column ----
const _excelDate = (v) => {
  if (v instanceof Date) return `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}-${String(v.getDate()).padStart(2, '0')}`
  return v
}
export function parseFlexibleWorkbook(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: true })
  const columns = ['Category']
  const rows = []
  for (const sheetName of wb.SheetNames) {
    const grid = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '' })
    let h = -1, fallback = -1
    for (let i = 0; i < Math.min(grid.length, 12); i++) {
      const cells = grid[i].map((c) => String(c).trim())
      if (cells.some((c) => /model/i.test(c))) { h = i; break }
      if (fallback === -1 && cells.filter(Boolean).length >= 3) fallback = i
    }
    if (h === -1) h = fallback
    if (h === -1) continue
    const hdr = grid[h].map((c, i) => String(c).trim() || ('Col' + (i + 1)))
    const cat = categoryFor(sheetName)
    for (const c of hdr) if (!columns.includes(c)) columns.push(c)
    for (let r = h + 1; r < grid.length; r++) {
      const row = grid[r]
      if (row.every((v) => String(v).trim() === '')) continue
      const cells = { Category: cat }
      let any = false
      hdr.forEach((c, i) => { let v = row[i]; if (v !== '' && v != null) { cells[c] = _excelDate(v); any = true } })
      if (any) rows.push(cells)
    }
  }
  const model_col = columns.find((c) => /model/i.test(c)) || columns.find((c) => c !== 'Category') || 'Model'
  const price_col = columns.find((c) => /^dp$/i.test(c)) || columns.find((c) => /dealer/i.test(c)) ||
    columns.find((c) => /price|rate/i.test(c)) || columns.find((c) => /^mrp$/i.test(c)) || null
  return { columns, model_col, price_col, rows }
}
