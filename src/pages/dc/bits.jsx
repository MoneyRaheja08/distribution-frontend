import { Plus, Trash2 } from 'lucide-react'
import { inr } from '../../lib/format.js'

export const inp = 'w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-[15px] bg-white text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100'
export const today = () => new Date().toISOString().slice(0, 10)
export const MODES = [
  ['cash', 'Cash', 'bg-emerald-500', 'text-emerald-700 bg-emerald-50 ring-emerald-100'],
  ['card', 'Card', 'bg-sky-500', 'text-sky-700 bg-sky-50 ring-sky-100'],
  ['upi', 'UPI', 'bg-violet-500', 'text-violet-700 bg-violet-50 ring-violet-100'],
  ['finance', 'Finance', 'bg-amber-500', 'text-amber-700 bg-amber-50 ring-amber-100'],
  ['cheque', 'Cheque', 'bg-rose-500', 'text-rose-700 bg-rose-50 ring-rose-100'],
]

export function niceDate(s) {
  if (!s) return ''
  const d = new Date(s + 'T00:00:00')
  if (s === today()) return 'Today'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' })
}

export function Hero({ eyebrow, value, sub, right, children, testid }) {
  return (
    <div data-testid={testid} className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-5 shadow-lift">
      <div className="pointer-events-none absolute -top-20 -right-10 h-48 w-48 rounded-full bg-brand-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-10 h-48 w-48 rounded-full bg-sky-500/20 blur-3xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-300">{eyebrow}</div>
          <div className="font-display text-4xl font-bold tracking-tight mt-1">{value}</div>
          {sub && <div className="text-[12.5px] text-slate-400 mt-1">{sub}</div>}
        </div>
        {right}
      </div>
      {children && <div className="relative mt-4">{children}</div>}
    </div>
  )
}

export function Stat({ label, v, sub, tone = 'text-slate-900', icon: Icon, testid }) {
  return (
    <div data-testid={testid} className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-slate-400">{label}</div>
        {Icon && <Icon size={14} className="text-slate-300" />}
      </div>
      <div className={'font-display text-xl font-bold tracking-tight mt-1 ' + tone}>{v}</div>
      {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  )
}

export function ModeBar({ d = {}, dark = false }) {
  const vals = MODES.map(([k]) => +(k === 'cash' ? d.cash ?? d.cash_in : d[k]) || 0)
  const sum = vals.reduce((a, b) => a + b, 0) || 1
  return (
    <div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/10">
        {MODES.map(([k, , bar], i) => vals[i] > 0 && <div key={k} className={bar + ' transition-all duration-500'} style={{ width: (vals[i] / sum) * 100 + '%' }} />)}
      </div>
      <div className="mt-2.5 grid grid-cols-5 gap-1">
        {MODES.map(([k, l, bar], i) => (
          <div key={k} className="min-w-0">
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide"><span className={'h-1.5 w-1.5 rounded-full ' + bar} /><span className={dark ? 'text-slate-400' : 'text-slate-400'}>{l}</span></div>
            <div className={'text-[12px] font-bold truncate ' + (dark ? 'text-white' : 'text-slate-800')}>{inr(vals[i])}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <div className="flex justify-between text-[12px] font-semibold text-slate-600 mb-1.5"><span>{label}</span>{hint && <span className="text-slate-400 font-medium">{hint}</span>}</div>
      {children}
    </label>
  )
}

export function Section({ title, right, children }) {
  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-2 px-0.5">
        <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">{title}</div>
        {right}
      </div>
      {children}
    </div>
  )
}

export function ListCard({ children, empty, testid }) {
  const kids = Array.isArray(children) ? children.filter(Boolean) : children
  const isEmpty = !kids || (Array.isArray(kids) && kids.length === 0)
  return (
    <div data-testid={testid} className="bg-white border border-slate-200/80 rounded-2xl shadow-soft overflow-hidden divide-y divide-slate-100">
      {isEmpty ? <div className="p-8 text-center text-[13px] text-slate-400">{empty || 'Nothing here yet.'}</div> : kids}
    </div>
  )
}

export function Row({ title, sub, right, onDelete, onClick, tone = 'bg-brand-500', testid, children }) {
  return (
    <div data-testid={testid} onClick={onClick} className={'group relative flex items-center gap-3 px-4 py-3 ' + (onClick ? 'cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors' : '')}>
      <span className={'h-9 w-1 rounded-full shrink-0 ' + tone} />
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-semibold text-slate-900 truncate">{title}</div>
        {sub && <div className="text-[11.5px] text-slate-500 truncate mt-0.5">{sub}</div>}
        {children}
      </div>
      {right && <div className="shrink-0 text-right">{right}</div>}
      {onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete() }} aria-label="Delete" className="shrink-0 text-slate-300 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"><Trash2 size={15} /></button>}
    </div>
  )
}

export function Chip({ tone = 'text-slate-600 bg-slate-100 ring-slate-200', children, onClick, testid }) {
  const C = onClick ? 'button' : 'span'
  return <C data-testid={testid} onClick={onClick} className={'inline-flex items-center text-[10.5px] font-bold px-2 py-0.5 rounded-full ring-1 ' + tone + (onClick ? ' active:scale-95 transition-transform' : '')}>{children}</C>
}

export function Fab({ onClick, label = 'Add', testid }) {
  return (
    <button data-testid={testid} onClick={onClick}
      className="fixed bottom-24 right-5 lg:bottom-8 lg:right-10 z-20 flex items-center gap-2 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold pl-4 pr-5 py-3.5 shadow-glow hover:-translate-y-0.5 active:scale-95 transition-all">
      <Plus size={18} strokeWidth={2.6} />{label}
    </button>
  )
}

export function PrimaryBtn({ onClick, disabled, children, testid }) {
  return (
    <button data-testid={testid} onClick={onClick} disabled={disabled}
      className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-glow active:scale-[.99] transition-all">
      {children}
    </button>
  )
}

export function PageHead({ title, sub, right }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {sub && <div className="text-[12.5px] text-slate-500 mt-0.5">{sub}</div>}
      </div>
      {right}
    </div>
  )
}

export function DateNav({ date, setDate, testid = 'dc-date' }) {
  const shift = (n) => { const d = new Date(date + 'T00:00:00'); d.setDate(d.getDate() + n); setDate(d.toISOString().slice(0, 10)) }
  return (
    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-soft">
      <button onClick={() => shift(-1)} className="px-2 py-1 text-slate-500 hover:text-slate-900 font-bold">‹</button>
      <input type="date" data-testid={testid} value={date} onChange={(e) => setDate(e.target.value)} className="text-[13px] font-semibold text-slate-800 outline-none bg-transparent w-[8.5rem]" />
      <button onClick={() => shift(1)} disabled={date >= today()} className="px-2 py-1 text-slate-500 hover:text-slate-900 font-bold disabled:opacity-30">›</button>
    </div>
  )
}
