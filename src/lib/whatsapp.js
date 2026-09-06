import { inr } from './format.js'

// Build a wa.me click-to-chat link (works without any API).
export function waLink(phone, text) {
  let p = String(phone || '').replace(/\D/g, '')
  if (p.length === 10) p = '91' + p           // default India country code
  return 'https://wa.me/' + p + '?text=' + encodeURIComponent(text)
}

// Polite overdue reminder message from a dealer's ledger summary.
export function reminderText(dealer, outstanding, ageing) {
  const over90 = ageing?.age_90p || 0
  let msg = `Dear ${dealer},\n\nThis is a gentle reminder from Ashoka Distribution. Your current outstanding balance is ${inr(outstanding)}.`
  if (over90 > 0) msg += `\nOf this, ${inr(over90)} is over 90 days old.`
  msg += `\n\nKindly arrange the payment at your earliest convenience. Please ignore if already paid.\n\nThank you.`
  return msg
}
