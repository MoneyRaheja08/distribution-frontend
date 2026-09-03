import { Plus, Pencil, Trash2, Loader2, ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const Spin = () => (
  <div className="flex justify-center py-20 text-slate-400"><Loader2 className="animate-spin" /></div>
)

export const Empty = ({ children }) => <div className="text-[12px] text-slate-400 py-1">{children}</div>

export function SectionH({ children, onAdd }) {
  return (
    <div className="flex justify-between items-center text-xs font-bold text-slate-600 mb-2.5 px-0.5">
      <span>{children}</span>
      {onAdd && (
        <button onClick={onAdd} className="text-emerald-700 bg-emerald-50 rounded-full px-3 py-1.5 flex items-center gap-1">
          <Plus size={13} />Add
        </button>
      )}
    </div>
  )
}

export function Card({ n, l, tone = '' }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5">
      <div className={'text-lg font-extrabold ' + tone}>{n}</div>
      <div className="text-[11px] text-slate-500 mt-0.5">{l}</div>
    </div>
  )
}

export function Pill({ tone, children }) {
  const tones = {
    ok: 'bg-emerald-50 text-emerald-700',
    over: 'bg-amber-50 text-amber-700',
    old: 'bg-red-50 text-red-700',
  }
  return <span className={'inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 mr-1 ' + tones[tone]}>{children}</span>
}

export function RowActions({ onEdit, onDel }) {
  return (
    <div className="flex gap-1.5 mt-2">
      <button onClick={onEdit} className="text-[11px] font-semibold text-slate-600 border border-slate-200 rounded-lg px-2.5 py-1 flex items-center gap-1"><Pencil size={11} />Edit</button>
      {onDel && <button onClick={onDel} className="text-[11px] font-semibold text-red-700 border border-red-200 rounded-lg px-2.5 py-1 flex items-center gap-1"><Trash2 size={11} />Delete</button>}
    </div>
  )
}

export function BackBtn({ label = 'Back' }) {
  const nav = useNavigate()
  return (
    <button onClick={() => nav(-1)} className="flex items-center gap-1 text-sm font-semibold text-slate-600 mb-2 -ml-1">
      <ChevronLeft size={18} />{label}
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
        className={'w-full border border-slate-200 rounded-lg px-3 py-2.5 bg-white outline-none focus:border-emerald-500 ' + (big ? 'text-lg' : 'text-base')}
      />
    </div>
  )
}

export function Select({ label, value, onChange, options }) {
  return (
    <div className="mb-3">
      <div className="text-xs font-semibold text-slate-600 mb-1.5">{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 bg-white text-base outline-none focus:border-emerald-500">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  )
}

export function Modal({ title, children, onClose }) {
  return (
    <div className="absolute inset-0 bg-slate-900/40 flex items-end z-20"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-slate-100 w-full rounded-t-3xl p-5 max-h-[92%] overflow-y-auto">
        <div className="text-base font-bold mb-4">{title}</div>
        {children}
      </div>
    </div>
  )
}
