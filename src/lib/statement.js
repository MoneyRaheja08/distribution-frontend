import * as XLSX from 'xlsx-js-style'

const norm = (s) => String(s == null ? '' : s).trim().toLowerCase()
const num = (v) => { if (v == null || v === '') return null; const n = Number(String(v).replace(/[^0-9.\-]/g, '')); return isFinite(n) ? Math.round(n) : null }

function excelDate(v) {
  if (v instanceof Date) {
    return `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}-${String(v.getDate()).padStart(2, '0')}`
  }
  if (typeof v === 'number') {
    const d = XLSX.SSF.parse_date_code(v)
    if (d) return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`
  }
  const s = String(v || '').trim()
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return `${m[1]}-${m[2]}-${m[3]}`
  m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/); if (m) return `${m[3]}-${m[2]}-${m[1]}`
  return null
}

const MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 }
const p2 = (n) => String(n).padStart(2, '0')
// Robust date reader: Date object, Excel serial, YYYY-MM-DD, DD/MM/YYYY, DD-MM-YY, DD-Mon-YY(YY)
function toISO(v) {
  if (v instanceof Date && !isNaN(v)) return `${v.getFullYear()}-${p2(v.getMonth() + 1)}-${p2(v.getDate())}`
  if (typeof v === 'number') { const d = XLSX.SSF.parse_date_code(v); if (d && d.y) return `${d.y}-${p2(d.m)}-${p2(d.d)}` }
  const s = String(v || '').trim()
  if (!s) return null
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); if (m) return `${m[1]}-${p2(m[2])}-${p2(m[3])}`
  m = s.match(/^(\d{1,2})[/-]([A-Za-z]{3,})[/-](\d{2,4})$/)
  if (m) { const mm = MON[m[2].slice(0, 3).toLowerCase()]; if (mm) { const y = m[3].length === 2 ? 2000 + +m[3] : +m[3]; return `${y}-${p2(mm)}-${p2(m[1])}` } }
  m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
  if (m) { const y = m[3].length === 2 ? 2000 + +m[3] : +m[3]; return `${y}-${p2(m[2])}-${p2(m[1])}` }
  const d2 = new Date(s); if (!isNaN(d2)) return `${d2.getFullYear()}-${p2(d2.getMonth() + 1)}-${p2(d2.getDate())}`
  return null
}
const dayBefore = (iso) => { if (!iso) return null; const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() - 1); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}` }

// MARG-style dealer statement: Date | Type | Particulars | Debit | Credit | Balance
export function parseStatement(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: true })
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' })
  // dealer name: first non-empty cell in the first few rows that isn't a date/number/title keyword
  let dealer_name = ''
  for (let i = 0; i < Math.min(rows.length, 4); i++) {
    const cell = (rows[i] || []).map((x) => String(x || '').trim()).find(Boolean)
    if (cell && !/^\d/.test(cell) && !/sales|account|statement|ledger/i.test(cell)) { dealer_name = cell; break }
  }
  let h = -1
  for (let i = 0; i < Math.min(rows.length, 16); i++) {
    const c = (rows[i] || []).map(norm)
    if (c.includes('particulars') && c.includes('debit') && c.includes('credit')) { h = i; break }
  }
  if (h === -1) throw new Error('Could not find the statement columns (Date / Particulars / Debit / Credit). Please upload a MARG account-statement export.')
  const H = rows[h].map(norm)
  const cDate = H.indexOf('date'), cPart = H.indexOf('particulars'), cDeb = H.indexOf('debit'), cCred = H.indexOf('credit')
  let opening = 0, opening_date = null
  const bills = [], payments = []
  let earliest = null
  for (let r = h + 1; r < rows.length; r++) {
    const row = rows[r]
    if (!row || !row.length) continue
    const part = String(row[cPart] || '').trim()
    const low = part.toLowerCase()
    const deb = num(row[cDeb]), cred = num(row[cCred])
    const date = toISO(cDate >= 0 ? row[cDate] : null)
    if (low.startsWith('opening balance')) { opening = (deb || 0) - (cred || 0); if (date) opening_date = date; continue }
    if (low.startsWith('closing balance')) continue
    if (!deb && !cred) continue // not a ledger entry (blank/section row)
    if (date && (!earliest || date < earliest)) earliest = date
    if (deb) {
      const billNo = (part.match(/bill\s*no\.?\s*:?\s*(\S+)/i) || [])[1] || part || ('BILL-' + r)
      bills.push({ bill_no: billNo, date, amount: deb })
    } else {
      const ref = (part.match(/(?:cheque|chq|ref)\.?\s*no\.?\s*:?\s*(\S+)/i) || [])[1] || part || ''
      payments.push({ ref, date, amount: cred })
    }
  }
  if (!opening_date) opening_date = dayBefore(earliest)  // keep opening before the first entry
  return { dealer_name, opening: opening > 0 ? opening : 0, opening_date, bills, payments }
}

// Bulk new bills: Dealer | Bill No | Date | Amount
export function parseBulkBills(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: true })
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' })
  let h = -1
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const c = rows[i].map(norm)
    if (c.some((x) => x.includes('bill')) && c.some((x) => x.includes('amount'))) { h = i; break }
  }
  if (h === -1) throw new Error('Need columns: Dealer, Bill No, Date, Amount.')
  const H = rows[h].map(norm)
  const find = (names) => H.findIndex((c) => names.some((n) => c.includes(n)))
  const cDealer = find(['dealer', 'party', 'name']), cBill = find(['bill', 'invoice']), cDate = find(['date']), cAmt = find(['amount', 'total'])
  const out = []
  for (let r = h + 1; r < rows.length; r++) {
    const row = rows[r]
    const name = String(row[cDealer] || '').trim()
    const bill_no = String(row[cBill] || '').trim()
    const amount = num(row[cAmt])
    if (!name || !bill_no || !amount) continue
    out.push({ dealer_name: name, bill_no, date: excelDate(row[cDate]), amount })
  }
  return out
}

export function downloadBillsTemplate() {
  const rows = [['Dealer', 'Bill No', 'Date', 'Amount'], ['Khanna Enterprises', 'H00002', '2026-09-05', 45000]]
  const ws = XLSX.utils.aoa_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Bills')
  XLSX.writeFile(wb, 'bills-template.xlsx')
}
