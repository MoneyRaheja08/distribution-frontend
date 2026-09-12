import { useRef, useEffect } from 'react'
import { Plus, Pencil, Trash2, Loader2, ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const Spin = () => (
  <div className="flex justify-center py-20 text-brand-600 dark:text-brand-400"><Loader2 className="animate-spin" /></div>
)

export const Empty = ({ children }) => <div className="text-[12px] text-slate-400 dark:text-slate-500 py-1">{children}</div>

export function EmptyState({ icon: Icon, title, hint, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 bg-white/60 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl animate-fade-up">
      <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-500/10 ring-1 ring-brand-100 dark:ring-brand-500/25 flex items-center justify-center mb-3">
        {Icon ? <Icon size={24} className="text-brand-600 dark:text-brand-400" /> : <Plus size={24} className="text-brand-600 dark:text-brand-400" />}
      </div>
      <div className="font-display text-[15px] font-bold text-slate-700 dark:text-slate-200">{title}</div>
      {hint && <div className="text-[12.5px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs leading-relaxed">{hint}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function SectionH({ children, onAdd }) {
  return (
    <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 mb-2.5 px-0.5">
      <span>{children}</span>
      {onAdd && (
        <button onClick={onAdd} className="text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 dark:hover:bg-brand-500/20 ring-1 ring-brand-100 dark:ring-brand-500/20 rounded-full px-3 py-1.5 flex items-center gap-1 transition-colors">
          <Plus size={13} />Add
        </button>
      )}
    </div>
  )
}

export function Card({ n, l, tone = '' }) {
  return (
    <div className="group relative bg-white dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-4 shadow-soft hover:shadow-lift hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-500/0 via-brand-500/60 to-brand-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-slate-400 dark:text-slate-500">{l}</div>
      <div className={'font-display text-2xl font-bold tracking-tight mt-1 text-slate-900 dark:text-slate-100 ' + tone}>{n}</div>
    </div>
  )
}

export function Pill({ tone, children }) {
  const tones = {
    ok: 'bg-brand-50 text-brand-700 ring-brand-100 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/20',
    over: 'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20',
    old: 'bg-red-50 text-red-700 ring-red-100 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20',
  }
  return <span className={'inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 mt-1 mr-1 ' + tones[tone]}>{children}</span>
}

export function RowActions({ onEdit, onDel }) {
  return (
    <div className="flex gap-1.5 mt-2">
      <button onClick={onEdit} className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg px-2.5 py-1 flex items-center gap-1 transition-colors"><Pencil size={11} />Edit</button>
      {onDel && <button onClick={onDel} className="text-[11px] font-semibold text-red-700 dark:text-red-300 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg px-2.5 py-1 flex items-center gap-1 transition-colors"><Trash2 size={11} />Delete</button>}
    </div>
  )
}

export function BackBtn({ label = 'Back' }) {
  const nav = useNavigate()
  return (
    <button onClick={() => nav(-1)} className="group flex items-center gap-1 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 mb-2 -ml-1 transition-colors">
      <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />{label}
    </button>
  )
}

export function Field({ label, value, onChange, type = 'text', placeholder, big }) {
  return (
    <div className="mb-3">
      <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">{label}</div>
      <input
        type={type} value={value} placeholder={placeholder}
        inputMode={type === 'number' ? 'numeric' : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={'w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-colors focus:border-brand-500 ' + (big ? 'text-lg font-semibold' : 'text-base')}
      />
    </div>
  )
}

export function Select({ label, value, onChange, options }) {
  return (
    <div className="mb-3">
      <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-base outline-none transition-colors focus:border-brand-500">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  )
}

export function Modal({ title, children, onClose }) {
  const boxRef = useRef(null)
  useEffect(() => {
    // freeze the page behind the sheet so the keyboard / drag can't scroll it away
    const root = document.documentElement
    const main = document.querySelector('main')
    const prevMain = main ? main.style.overflow : ''
    root.classList.add('modal-open')
    if (main) main.style.overflow = 'hidden'
    if (boxRef.current) boxRef.current.scrollTop = 0
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => { root.classList.remove('modal-open'); if (main) main.style.overflow = prevMain; window.removeEventListener('keydown', onKey) }
  }, []) // eslint-disable-line
  return (
    <div className="fixed inset-0 h-[100dvh] bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm flex items-end lg:items-center lg:justify-center z-30 animate-fade-in overscroll-contain"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={boxRef} role="dialog" aria-modal="true"
        className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-md rounded-t-3xl lg:rounded-2xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] max-h-[92dvh] overflow-y-auto overscroll-contain shadow-2xl border border-slate-200/60 dark:border-slate-700 animate-slide-up">
        <div className="mx-auto lg:hidden w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700 mb-4 -mt-1" />
        <div className="flex items-center justify-between mb-4">
          <div className="font-display text-base font-bold">{title}</div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl leading-none px-1 -mr-1">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}


export function SkeletonList({ rows = 6 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-shine bg-white dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-3.5 shadow-soft">
          <div className="h-3.5 w-1/2 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
          <div className="h-2.5 w-1/3 bg-slate-100 dark:bg-slate-800 rounded" />
        </div>
      ))}
    </div>
  )
}
