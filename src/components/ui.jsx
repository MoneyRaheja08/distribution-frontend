import { Plus, Pencil, Trash2, Loader2, ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const Spin = () => (
  <div className="flex justify-center py-20 text-brand-600"><Loader2 className="animate-spin" /></div>
)

export const Empty = ({ children }) => <div className="text-[12px] text-slate-400 py-1">{children}</div>

export function SectionH({ children, onAdd }) {
  return (
    <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 mb-2.5 px-0.5">
      <span>{children}</span>
      {onAdd && (
        <button onClick={onAdd} className="text-brand-700 bg-brand-50 hover:bg-brand-100 ring-1 ring-brand-100 rounded-full px-3 py-1.5 flex items-center gap-1 transition-colors">
          <Plus size={13} />Add
        </button>
      )}
    </div>
  )
}

export function Card({ n, l, tone = '' }) {
  return (
    <div className="group relative bg-white border border-slate-200/70 rounded-2xl p-4 shadow-soft hover:shadow-lift hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-500/0 via-brand-500/60 to-brand-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-slate-400">{l}</div>
      <div className={'font-display text-2xl font-bold tracking-tight mt-1 ' + tone}>{n}</div>
    </div>
  )
}

export function Pill({ tone, children }) {
  const tones = {
    ok: 'bg-brand-50 text-brand-700 ring-brand-100',
    over: 'bg-amber-50 text-amber-700 ring-amber-100',
    old: 'bg-red-50 text-red-700 ring-red-100',
  }
  return <span className={'inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 mt-1 mr-1 ' + tones[tone]}>{children}</span>
}

export function RowActions({ onEdit, onDel }) {
  return (
    <div className="flex gap-1.5 mt-2">
      <button onClick={onEdit} className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-lg px-2.5 py-1 flex items-center gap-1 transition-colors"><Pencil size={11} />Edit</button>
      {onDel && <button onClick={onDel} className="text-[11px] font-semibold text-red-700 bg-white border border-red-200 hover:bg-red-50 rounded-lg px-2.5 py-1 flex items-center gap-1 transition-colors"><Trash2 size={11} />Delete</button>}
    </div>
  )
}

export function BackBtn({ label = 'Back' }) {
  const nav = useNavigate()
  return (
    <button onClick={() => nav(-1)} className="group flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-800 mb-2 -ml-1 transition-colors">
      <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />{label}
    </button>
  )
}

export function Field({ label, value, onChange, type = 'text', placeholder, big }) {
  return (
    <div className="mb-3">
      <div className="text-xs font-semibold text-slate-600 mb-1.5">{label}</div>
      <input
        type={type} value={value} placeholder={placeholder}
        inputMode={type === 'number' ? 'numeric' : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={'w-full border border-slate-200 rounded-xl px-3.5 py-2.5 bg-white outline-none transition-colors focus:border-brand-500 ' + (big ? 'text-lg font-semibold' : 'text-base')}
      />
    </div>
  )
}

export function Select({ label, value, onChange, options }) {
  return (
    <div className="mb-3">
      <div className="text-xs font-semibold text-slate-600 mb-1.5">{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 bg-white text-base outline-none transition-colors focus:border-brand-500">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  )
}

export function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end lg:items-center lg:justify-center z-30 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full max-w-md rounded-t-3xl lg:rounded-2xl p-5 max-h-[92%] overflow-y-auto shadow-2xl border border-slate-200/60 animate-slide-up">
        <div className="mx-auto lg:hidden w-10 h-1 rounded-full bg-slate-200 mb-4 -mt-1" />
        <div className="font-display text-base font-bold mb-4">{title}</div>
        {children}
      </div>
    </div>
  )
}


export function SkeletonList({ rows = 6 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-shine bg-white border border-slate-200/70 rounded-2xl p-3.5 shadow-soft">
          <div className="h-3.5 w-1/2 bg-slate-200 rounded mb-2" />
          <div className="h-2.5 w-1/3 bg-slate-100 rounded" />
        </div>
      ))}
    </div>
  )
}
