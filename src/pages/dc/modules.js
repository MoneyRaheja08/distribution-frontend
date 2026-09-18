import { Wallet, BarChart3, BellRing, Tag, CheckSquare, AlertTriangle, ClipboardCheck, Gift, ScrollText, CalendarCheck, Users, Receipt, Clock, Lock } from 'lucide-react'
import { inr } from '../../lib/format.js'

export const CORE = [
  ['/collections', 'Bills', Wallet, 'Record today\'s sales & payments', 'bg-emerald-500'],
  ['/pending', 'Pending', Clock, 'Money customers still owe', 'bg-amber-500'],
  ['/expenses', 'Expenses', Receipt, 'Daily shop expenses', 'bg-rose-500'],
  ['/dayclose', 'Day close', Lock, 'Cash reconciliation & handover', 'bg-slate-700'],
  ['/reports', 'Reports', BarChart3, 'Trends, staff & payment modes', 'bg-sky-500'],
]

export const CRUD = {
  reminders: {
    title: 'Reminders', icon: BellRing, tone: 'bg-amber-500', hint: 'Follow up on money customers owe.', amountKey: 'amount',
    fields: [{ k: 'party', label: 'Customer', full: true, required: true }, { k: 'phone', label: 'Phone', type: 'tel' }, { k: 'amount', label: 'Amount ₹', type: 'number' }, { k: 'due_date', label: 'Due date', type: 'date' }, { k: 'note', label: 'Note', full: true }],
    primary: (r) => r.party, amount: (r) => inr(r.amount),
    secondary: (r) => [r.due_date && 'due ' + r.due_date, r.phone, r.note].filter(Boolean).join(' · '),
    toggles: [{ k: 'done', onLabel: 'Collected', offLabel: 'Pending', onTone: 'text-emerald-700 bg-emerald-50 ring-emerald-100' }],
  },
  pricelist: {
    title: 'Price List', icon: Tag, tone: 'bg-sky-500', hint: 'Your selling price per model.', search: true,
    fields: [{ k: 'brand', label: 'Brand' }, { k: 'model', label: 'Model', required: true }, { k: 'price', label: 'Price ₹', type: 'number' }, { k: 'note', label: 'Note', full: true }],
    primary: (r) => r.model, amount: (r) => inr(r.price),
    secondary: (r) => [r.brand, r.note].filter(Boolean).join(' · '),
  },
  todo: {
    title: 'To-Do', icon: CheckSquare, tone: 'bg-violet-500', hint: 'Things to get done.',
    fields: [{ k: 'task', label: 'Task', full: true, required: true }, { k: 'due_date', label: 'Due', type: 'date' }, { k: 'priority', label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High'] }],
    primary: (r) => r.task,
    secondary: (r) => [r.priority, r.due_date && 'due ' + r.due_date].filter(Boolean).join(' · '),
    toggles: [{ k: 'done', onLabel: 'Done', offLabel: 'Open' }],
  },
  defective: {
    title: 'Defective', icon: AlertTriangle, tone: 'bg-rose-500', hint: 'Defective / return units and their status.',
    fields: [{ k: 'brand', label: 'Brand' }, { k: 'model', label: 'Model', required: true }, { k: 'qty', label: 'Qty', type: 'number' }, { k: 'reason', label: 'Reason' }, { k: 'status', label: 'Status', type: 'select', options: ['Pending', 'Sent for repair', 'Returned', 'Scrapped'], full: true }, { k: 'note', label: 'Note', full: true }],
    primary: (r) => r.model + ' × ' + (r.qty || 1),
    secondary: (r) => [r.brand, r.reason].filter(Boolean).join(' · '),
    badge: (r) => r.status,
  },
  audits: {
    title: 'Stock Audit', icon: ClipboardCheck, tone: 'bg-teal-500', hint: 'Stock-check sessions and findings.',
    fields: [{ k: 'title', label: 'Audit title', full: true, required: true }, { k: 'expected', label: 'Expected qty', type: 'number' }, { k: 'actual', label: 'Counted qty', type: 'number' }, { k: 'note', label: 'Note', full: true }],
    primary: (r) => r.title, amount: (r) => { const d = (+r.actual || 0) - (+r.expected || 0); return (d > 0 ? '+' : '') + d },
    secondary: (r) => 'expected ' + (r.expected || 0) + ' · counted ' + (r.actual || 0),
    toggles: [{ k: 'closed', onLabel: 'Closed', offLabel: 'Open' }],
  },
  schemes: {
    title: 'Schemes', icon: Gift, tone: 'bg-fuchsia-500', hint: 'Running offers & schemes.',
    fields: [{ k: 'title', label: 'Scheme', full: true, required: true }, { k: 'brand', label: 'Brand' }, { k: 'start_date', label: 'Start', type: 'date' }, { k: 'end_date', label: 'End', type: 'date' }, { k: 'note', label: 'Details', full: true }],
    primary: (r) => r.title,
    secondary: (r) => [r.brand, r.start_date && r.start_date + ' → ' + (r.end_date || 'open'), r.note].filter(Boolean).join(' · '),
  },
  ledger: {
    title: 'Payment Audit', icon: ScrollText, tone: 'bg-indigo-500', hint: 'Ledger rows with running balance (credit − debit).', running: true,
    fields: [{ k: 'date', label: 'Date', type: 'date' }, { k: 'particulars', label: 'Particulars', required: true }, { k: 'debit', label: 'Debit ₹', type: 'number' }, { k: 'credit', label: 'Credit ₹', type: 'number' }],
    primary: (r) => r.particulars,
    secondary: (r) => [r.date, +r.debit ? 'Dr ' + inr(r.debit) : '', +r.credit ? 'Cr ' + inr(r.credit) : ''].filter(Boolean).join(' · '),
    toggles: [{ k: 'verified', onLabel: 'Verified', offLabel: 'Verify' }],
  },
  attendance: {
    title: 'Attendance', icon: CalendarCheck, tone: 'bg-lime-500', hint: 'Present days × per-day rate = payable.',
    fields: [{ k: 'name', label: 'Staff name', full: true, required: true }, { k: 'month', label: 'Month', type: 'month' }, { k: 'present_days', label: 'Present days', type: 'number' }, { k: 'per_day', label: 'Per-day ₹', type: 'number' }],
    primary: (r) => r.name, amount: (r) => inr((+r.present_days || 0) * (+r.per_day || 0)),
    secondary: (r) => [r.month, (r.present_days || 0) + ' days × ' + inr(r.per_day || 0)].filter(Boolean).join(' · '),
  },
  crm: {
    title: 'CRM', icon: Users, tone: 'bg-cyan-500', hint: 'Customer visits, enquiries & follow-ups.', search: true,
    fields: [{ k: 'customer', label: 'Customer', full: true, required: true }, { k: 'phone', label: 'Phone', type: 'tel' }, { k: 'purpose', label: 'Purpose' }, { k: 'follow_up_date', label: 'Follow-up', type: 'date' }, { k: 'note', label: 'Note', full: true }],
    primary: (r) => r.customer,
    secondary: (r) => [r.phone, r.purpose, r.follow_up_date && 'follow-up ' + r.follow_up_date, r.note].filter(Boolean).join(' · '),
    toggles: [{ k: 'done', onLabel: 'Closed', offLabel: 'Open' }],
  },
}
