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

// MARG-style dealer statement: Date | Type | Particulars | Debit | Credit | Balance
export function parseStatement(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: true })
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' })
  const dealer_name = String(rows[1]?.[0] || '').trim()
  let h = -1
  for (let i = 0; i < Math.min(rows.length, 14); i++) {
    const c = rows[i].map(norm)
    if (c.includes('particulars') && c.includes('debit') && c.includes('credit')) { h = i; break }
  }
  if (h === -1) throw new Error('Could not find the statement columns (Date/Particulars/Debit/Credit).')
  const H = rows[h].map(norm)
  const cDate = H.indexOf('date'), cPart = H.indexOf('particulars'), cDeb = H.indexOf('debit'), cCred = H.indexOf('credit')
  let opening = 0, opening_date = null
  const bills = [], payments = []
  for (let r = h + 1; r < rows.length; r++) {
    const row = rows[r]
    const part = String(row[cPart] || '').trim()
    const deb = num(row[cDeb]), cred = num(row[cCred])
    const low = part.toLowerCase()
    if (low.startsWith('opening balance')) { opening = deb || 0; continue }
    if (low.startsWith('closing balance')) continue
    if (!part) continue
    const date = excelDate(row[cDate])
    if (deb) {
      const billNo = (part.match(/bill no\.?\s*:?\s*(\S+)/i) || [])[1] || part
      if (!opening_date && date) opening_date = date
      bills.push({ bill_no: billNo, date, amount: deb })
    } else if (cred) {
      const ref = (part.match(/(?:cheque|chq|ref)\.?\s*no\.?\s*:?\s*(\S+)/i) || [])[1] || part
      payments.push({ ref, date, amount: cred })
    }
  }
  return { dealer_name, opening, opening_date, bills, payments }
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
