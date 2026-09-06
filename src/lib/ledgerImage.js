import { inr } from './format.js'

const BUCKETS = { age_0_30: '0–30', age_31_60: '31–60', age_61_90: '61–90', age_90p: '90+' }
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const fmtDay = (d) => { if (!d) return ''; const [y, m, day] = d.split('-'); return `${day} ${MONTHS[(+m || 1) - 1]} ${y.slice(2)}` }

// Render a dealer's ledger (with per-bill ageing) to a PNG Blob.
export async function renderLedgerImage({ company, dealer, outstanding, ageing = {}, lastPayment, entries = [] }) {
  const DPR = 2, W = 940, pad = 28, rowH = 46
  const headTop = 150, tableHead = 40
  const H = headTop + tableHead + entries.length * rowH + 54
  const cv = document.createElement('canvas')
  cv.width = W * DPR; cv.height = H * DPR
  const x = cv.getContext('2d'); x.scale(DPR, DPR)
  x.textBaseline = 'middle'
  const R = (n) => inr(n)

  // background
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H)
  // brand band
  x.fillStyle = '#0E7C66'; x.fillRect(0, 0, W, 60)
  x.fillStyle = '#ffffff'; x.font = '700 20px system-ui, sans-serif'; x.textAlign = 'left'
  x.fillText(company || 'Ashoka Distribution', pad, 31)
  x.font = '400 13px system-ui, sans-serif'; x.textAlign = 'right'
  x.fillText('Statement', W - pad, 31)

  // dealer + outstanding
  x.textAlign = 'left'; x.fillStyle = '#0f172a'; x.font = '700 22px system-ui, sans-serif'
  x.fillText(dealer, pad, 88)
  x.font = '800 24px system-ui, sans-serif'; x.fillStyle = '#0f172a'
  x.fillText(R(outstanding), pad, 120)
  const ow = x.measureText(R(outstanding)).width
  x.font = '400 13px system-ui, sans-serif'; x.fillStyle = '#64748b'
  x.fillText('outstanding', pad + ow + 8, 121)
  // ageing summary (right)
  x.textAlign = 'right'; x.font = '400 12px system-ui, sans-serif'
  const ag = [['age_0_30', '#0E7C66'], ['age_31_60', '#5B8A72'], ['age_61_90', '#B4884A'], ['age_90p', '#B23A32']]
    .filter(([k]) => (ageing[k] || 0) > 0).map(([k, c]) => `${BUCKETS[k]}: ${R(ageing[k])}`).join('    ')
  x.fillStyle = '#64748b'; x.fillText(ag, W - pad, 100)
  if (lastPayment) x.fillText(`Last paid ${R(lastPayment.amount)} · ${fmtDay(lastPayment.date)}`, W - pad, 120)
  x.textAlign = 'left'

  // column x positions (right edges for numbers)
  const xBal = W - pad, xCredit = W - pad - 175, xDebit = W - pad - 350
  // table header
  const ty = headTop
  x.fillStyle = '#0E7C66'; x.fillRect(0, ty, W, tableHead)
  x.fillStyle = '#ffffff'; x.font = '700 12px system-ui, sans-serif'
  x.fillText('PARTICULARS', pad, ty + tableHead / 2)
  x.textAlign = 'right'
  x.fillText('DEBIT', xDebit, ty + tableHead / 2)
  x.fillText('CREDIT', xCredit, ty + tableHead / 2)
  x.fillText('BALANCE', xBal, ty + tableHead / 2)
  x.textAlign = 'left'

  // rows
  let y = ty + tableHead
  entries.forEach((e) => {
    const cy = y + rowH / 2
    // separator
    x.strokeStyle = '#eef2f6'; x.lineWidth = 1; x.beginPath(); x.moveTo(0, y + rowH); x.lineTo(W, y + rowH); x.stroke()
    const isBill = e.type === 'bill'
    const title = isBill ? (e.ref === 'Opening' ? 'Opening balance' : 'Bill ' + e.ref) : ((e.mode || 'Payment') + (e.ref && e.ref !== e.mode ? ' ' + e.ref : ''))
    x.fillStyle = '#0f172a'; x.font = '600 14px system-ui, sans-serif'; x.textAlign = 'left'
    x.fillText(title, pad, cy - 8)
    // subline: date + age
    let sub = fmtDay(e.date)
    x.font = '400 11px system-ui, sans-serif'; x.fillStyle = '#94a3b8'
    x.fillText(sub, pad, cy + 10)
    if (isBill && e.debit > 0 && e.days != null && e.ref !== 'Opening') {
      const dw = x.measureText(sub + '   ').width
      x.fillStyle = e.bucket === 'age_90p' ? '#B23A32' : '#94a3b8'
      x.font = (e.bucket === 'age_90p' ? '700 ' : '400 ') + '11px system-ui, sans-serif'
      x.fillText(`${e.days}d (${BUCKETS[e.bucket]})`, pad + dw, cy + 10)
    }
    // amounts
    x.textAlign = 'right'; x.font = '600 13px system-ui, sans-serif'
    if (e.debit) { x.fillStyle = '#0f172a'; x.fillText(R(e.debit), xDebit, cy) }
    if (e.credit) { x.fillStyle = '#0E7C66'; x.fillText(R(e.credit), xCredit, cy) }
    x.fillStyle = '#0f172a'; x.font = '700 13px system-ui, sans-serif'; x.fillText(R(e.balance), xBal, cy)
    x.textAlign = 'left'
    y += rowH
  })

  // footer
  x.fillStyle = '#94a3b8'; x.font = '400 11px system-ui, sans-serif'
  x.fillText('Generated ' + new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), pad, y + 26)

  return new Promise((resolve) => cv.toBlob((b) => resolve(b), 'image/png'))
}
