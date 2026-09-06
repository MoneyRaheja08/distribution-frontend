import { inr } from './format.js'

// Generic titled table -> PNG Blob. headers: [{label, type:'text'|'money'|'num', w}]
export async function renderTableImage({ company, title, subtitle, headers, rows }) {
  const DPR = 2, W = 960, pad = 28, rowH = 36, headH = 40, topH = 108
  const H = topH + headH + rows.length * rowH + 48
  const cv = document.createElement('canvas')
  cv.width = W * DPR; cv.height = H * DPR
  const x = cv.getContext('2d'); x.scale(DPR, DPR); x.textBaseline = 'middle'

  const tot = headers.reduce((s, h) => s + (h.w || 1), 0)
  const avail = W - pad * 2
  const widths = headers.map((h) => (h.w || 1) / tot * avail)
  const lefts = []; let acc = pad; widths.forEach((w) => { lefts.push(acc); acc += w })
  const fmt = (v, t) => t === 'money' ? inr(v) : (v == null ? '' : String(v))

  x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H)
  // brand band
  x.fillStyle = '#0E7C66'; x.fillRect(0, 0, 56, 0) // no-op keeps lints happy
  x.fillStyle = '#0E7C66'; x.fillRect(0, 0, W, 56)
  x.fillStyle = '#fff'; x.font = '700 20px system-ui, sans-serif'; x.textAlign = 'left'
  x.fillText(company || 'Ashoka Distribution', pad, 30)
  x.textAlign = 'right'; x.font = '400 13px system-ui, sans-serif'; x.fillText('Bill ageing', W - pad, 30)
  // title + subtitle
  x.textAlign = 'left'; x.fillStyle = '#0f172a'; x.font = '700 20px system-ui, sans-serif'
  x.fillText(title, pad, 82)
  if (subtitle) { x.font = '400 13px system-ui, sans-serif'; x.fillStyle = '#64748b'; x.fillText(subtitle, pad, 100) }

  // header row
  const hy = topH
  x.fillStyle = '#0E7C66'; x.fillRect(0, hy, W, headH)
  x.fillStyle = '#fff'; x.font = '700 12px system-ui, sans-serif'
  headers.forEach((h, i) => {
    const right = h.type === 'money' || h.type === 'num'
    x.textAlign = right ? 'right' : 'left'
    x.fillText(h.label, right ? lefts[i] + widths[i] - 8 : lefts[i] + 8, hy + headH / 2)
  })

  // rows
  let y = hy + headH
  rows.forEach((r) => {
    x.strokeStyle = '#eef2f6'; x.lineWidth = 1; x.beginPath(); x.moveTo(0, y + rowH); x.lineTo(W, y + rowH); x.stroke()
    headers.forEach((h, i) => {
      const right = h.type === 'money' || h.type === 'num'
      const is90 = h.type === 'text' && String(r[i]).includes('90+')
      x.fillStyle = is90 ? '#B23A32' : '#0f172a'
      x.font = (is90 ? '700 ' : '500 ') + '13px system-ui, sans-serif'
      x.textAlign = right ? 'right' : 'left'
      x.fillText(fmt(r[i], h.type), right ? lefts[i] + widths[i] - 8 : lefts[i] + 8, y + rowH / 2)
    })
    y += rowH
  })
  x.fillStyle = '#94a3b8'; x.font = '400 11px system-ui, sans-serif'; x.textAlign = 'left'
  x.fillText('Generated ' + new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), pad, y + 26)

  return new Promise((resolve) => cv.toBlob((b) => resolve(b), 'image/png'))
}
