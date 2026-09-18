import { useState } from 'react'
import { Wallet, BarChart3, BellRing, Tag, CheckSquare, AlertTriangle, ClipboardCheck, Gift, ScrollText, CalendarCheck, Users } from 'lucide-react'
import DailyCollections from './DailyCollections.jsx'
import DcReports from './DcReports.jsx'
import CrudModule from './CrudModule.jsx'

const inr = (n) => '₹' + Math.round(n || 0).toLocaleString('en-IN')

const MODULES = [
  ['collections', 'Collections', Wallet],
  ['reports', 'Reports', BarChart3],
  ['reminders', 'Reminders', BellRing],
  ['pricelist', 'Price List', Tag],
  ['todo', 'To-Do', CheckSquare],
  ['defective', 'Defective', AlertTriangle],
  ['audits', 'Stock Audit', ClipboardCheck],
  ['schemes', 'Schemes', Gift],
  ['ledger', 'Pmt Audit', ScrollText],
  ['attendance', 'Attendance', CalendarCheck],
  ['crm', 'CRM', Users],
]

export default function DcHub() {
  const [m, setM] = useState('collections')
  return (
    <>
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
        {MODULES.map(([k, l, Icon]) => (
          <button key={k} data-testid={'dc-mod-' + k} onClick={() => setM(k)}
            className={'flex items-center gap-1.5 text-[12px] font-semibold rounded-full px-3 py-1.5 border shrink-0 transition-colors ' + (m === k ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200')}>
            <Icon size={13} />{l}
          </button>
        ))}
      </div>
      {m === 'collections' && <DailyCollections />}
      {m === 'reports' && <DcReports />}
      {m === 'reminders' && (
        <CrudModule name="reminders" title="Payment reminders" hint="Track money customers still owe & follow up."
          fields={[{ k: 'party', label: 'Customer', full: true, required: true }, { k: 'phone', label: 'Phone' }, { k: 'amount', label: 'Amount ₹', type: 'number' }, { k: 'due_date', label: 'Due date', type: 'date' }, { k: 'note', label: 'Note', full: true }]}
          amountKey="amount"
          primary={(r) => r.party + ' · ' + inr(r.amount)}
          secondary={(r) => (r.due_date ? 'due ' + r.due_date : '') + (r.phone ? ' · ' + r.phone : '') + (r.note ? ' · ' + r.note : '')}
          toggles={[{ k: 'done', onLabel: 'Collected', offLabel: 'Pending', onTone: 'text-emerald-700 bg-emerald-50 ring-emerald-100' }]} />
      )}
      {m === 'pricelist' && (
        <CrudModule name="pricelist" title="Price list" hint="Your selling price per model." search
          fields={[{ k: 'brand', label: 'Brand' }, { k: 'model', label: 'Model', required: true }, { k: 'price', label: 'Price ₹', type: 'number' }, { k: 'note', label: 'Note', full: true }]}
          primary={(r) => r.model + ' · ' + inr(r.price)}
          secondary={(r) => (r.brand || '') + (r.note ? ' · ' + r.note : '')} />
      )}
      {m === 'todo' && (
        <CrudModule name="todo" title="Things to do"
          fields={[{ k: 'task', label: 'Task', full: true, required: true }, { k: 'due_date', label: 'Due', type: 'date' }, { k: 'priority', label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High'] }]}
          primary={(r) => r.task}
          secondary={(r) => [r.priority, r.due_date && 'due ' + r.due_date].filter(Boolean).join(' · ')}
          toggles={[{ k: 'done', onLabel: 'Done', offLabel: 'Open' }]} />
      )}
      {m === 'defective' && (
        <CrudModule name="defective" title="Defective stock" hint="Log defective/return units and their status."
          fields={[{ k: 'brand', label: 'Brand' }, { k: 'model', label: 'Model', required: true }, { k: 'qty', label: 'Qty', type: 'number' }, { k: 'reason', label: 'Reason' }, { k: 'status', label: 'Status', type: 'select', options: ['Pending', 'Sent for repair', 'Returned', 'Scrapped'] }, { k: 'note', label: 'Note', full: true }]}
          primary={(r) => r.model + ' × ' + (r.qty || 1)}
          secondary={(r) => [r.brand, r.reason, r.status].filter(Boolean).join(' · ')} />
      )}
      {m === 'audits' && (
        <CrudModule name="audits" title="Stock audit" hint="Record stock-check sessions and findings."
          fields={[{ k: 'title', label: 'Audit title', full: true, required: true }, { k: 'expected', label: 'Expected qty', type: 'number' }, { k: 'actual', label: 'Counted qty', type: 'number' }, { k: 'note', label: 'Note', full: true }]}
          primary={(r) => r.title}
          secondary={(r) => 'expected ' + (r.expected || 0) + ' · counted ' + (r.actual || 0) + ' · diff ' + ((+r.actual || 0) - (+r.expected || 0))}
          toggles={[{ k: 'closed', onLabel: 'Closed', offLabel: 'Open' }]} />
      )}
      {m === 'schemes' && (
        <CrudModule name="schemes" title="Schemes & offers"
          fields={[{ k: 'title', label: 'Scheme', full: true, required: true }, { k: 'brand', label: 'Brand' }, { k: 'start_date', label: 'Start', type: 'date' }, { k: 'end_date', label: 'End', type: 'date' }, { k: 'note', label: 'Details', full: true }]}
          primary={(r) => r.title}
          secondary={(r) => [r.brand, r.start_date && r.start_date + ' → ' + (r.end_date || ''), r.note].filter(Boolean).join(' · ')} />
      )}
      {m === 'ledger' && (
        <CrudModule name="ledger" title="Payment audit (ledger)" hint="Enter ledger rows, tick verified. Running balance = credit − debit." running
          fields={[{ k: 'date', label: 'Date', type: 'date' }, { k: 'particulars', label: 'Particulars', full: true, required: true }, { k: 'debit', label: 'Debit ₹', type: 'number' }, { k: 'credit', label: 'Credit ₹', type: 'number' }]}
          primary={(r) => r.particulars}
          secondary={(r) => [r.date, (+r.debit ? 'Dr ' + inr(r.debit) : ''), (+r.credit ? 'Cr ' + inr(r.credit) : '')].filter(Boolean).join(' · ')}
          toggles={[{ k: 'verified', onLabel: 'Verified', offLabel: 'Check' }]} />
      )}
      {m === 'attendance' && (
        <CrudModule name="attendance" title="Attendance & salary" hint="Present days × per-day rate = payable."
          fields={[{ k: 'name', label: 'Staff name', full: true, required: true }, { k: 'month', label: 'Month', type: 'text' }, { k: 'present_days', label: 'Present days', type: 'number' }, { k: 'per_day', label: 'Per-day ₹', type: 'number' }]}
          primary={(r) => r.name + ' · ' + inr((+r.present_days || 0) * (+r.per_day || 0))}
          secondary={(r) => [r.month, (r.present_days || 0) + ' days × ' + inr(r.per_day || 0)].filter(Boolean).join(' · ')} />
      )}
      {m === 'crm' && (
        <CrudModule name="crm" title="CRM / follow-ups" hint="Log customer visits, enquiries and follow-ups."
          fields={[{ k: 'customer', label: 'Customer', full: true, required: true }, { k: 'phone', label: 'Phone' }, { k: 'purpose', label: 'Purpose' }, { k: 'follow_up_date', label: 'Follow-up', type: 'date' }, { k: 'note', label: 'Note', full: true }]}
          primary={(r) => r.customer + (r.phone ? ' · ' + r.phone : '')}
          secondary={(r) => [r.purpose, r.follow_up_date && 'follow-up ' + r.follow_up_date, r.note].filter(Boolean).join(' · ')}
          toggles={[{ k: 'done', onLabel: 'Closed', offLabel: 'Open' }]} />
      )}
    </>
  )
}
