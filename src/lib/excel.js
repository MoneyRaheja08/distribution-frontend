import * as XLSX from 'xlsx-js-style'

// Indian number grouping (1,54,296 / 12,34,567 / 1,23,45,678)
const IND = '[>=10000000]#,##,##,##0;[>=100000]#,##,##0;##,##0'

const bd = (rgb) => { const s = { style: 'thin', color: { rgb } }; return { top: s, bottom: s, left: s, right: s } }
const HEADER = {
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
  fill: { fgColor: { rgb: '0E7C66' } },
  alignment: { horizontal: 'left', vertical: 'center' },
  border: bd('FFFFFF'),
}
const CELL = bd('E2E8F0')

// exportSheet(filename, aoa, { money:[colIndexes], sheet:'Name' })
export function exportSheet(filename, aoa, opts = {}) {
  const money = new Set(opts.money || [])
  const boldRows = new Set(opts.boldRows || [])   // section/dealer header rows
  const nrows = aoa.length
  const ncols = aoa.reduce((m, r) => Math.max(m, r.length), 0)
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  for (let r = 0; r < nrows; r++) {
    for (let c = 0; c < ncols; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })]
      if (!cell) continue
      if (r === 0) { cell.s = HEADER; continue }
      if (boldRows.has(r)) { cell.s = { font: { bold: true }, fill: { fgColor: { rgb: 'EEF2F6' } } }; continue }
      const isMoney = money.has(c) && typeof cell.v === 'number'
      cell.s = { border: CELL, alignment: { horizontal: isMoney ? 'right' : 'left', vertical: 'center' } }
      if (isMoney) cell.z = IND
    }
  }
  ws['!cols'] = Array.from({ length: ncols }, (_, c) => {
    let m = 9
    for (const row of aoa) { const v = row[c]; const len = v == null ? 0 : String(v).length; if (len > m) m = len }
    return { wch: Math.min(m + 2, 44) }
  })
  ws['!rows'] = [{ hpt: 22 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, opts.sheet || 'Report')
  XLSX.writeFile(wb, filename)
}


// Multi-sheet workbook (used for full backup). sheets: [{name, aoa, money}]
export function exportWorkbook(filename, sheets) {
  const wb = XLSX.utils.book_new()
  const bd = (rgb) => { const t = { style: 'thin', color: { rgb } }; return { top: t, bottom: t, left: t, right: t } }
  sheets.forEach(({ name, aoa, money }) => {
    const m = new Set(money || [])
    const ncols = aoa.reduce((x, r) => Math.max(x, r.length), 0)
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    for (let r = 0; r < aoa.length; r++) for (let c = 0; c < ncols; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })]; if (!cell) continue
      if (r === 0) { cell.s = { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '0E7C66' } }, border: bd('FFFFFF') }; continue }
      const isMoney = m.has(c) && typeof cell.v === 'number'
      cell.s = { border: bd('E2E8F0'), alignment: { horizontal: isMoney ? 'right' : 'left' } }
      if (isMoney) cell.z = '[>=10000000]#,##,##,##0;[>=100000]#,##,##0;##,##0'
    }
    ws['!cols'] = Array.from({ length: ncols }, (_, c) => { let x = 9; for (const row of aoa) { const v = row[c]; const l = v == null ? 0 : String(v).length; if (l > x) x = l } return { wch: Math.min(x + 2, 40) } })
    XLSX.utils.book_append_sheet(wb, ws, name)
  })
  XLSX.writeFile(wb, filename)
}
