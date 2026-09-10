import { Download } from 'lucide-react'

export function Big({ label, value, tone }) {
  return <div className="bg-white border border-slate-200 rounded-xl p-4 mb-3"><div className={'text-2xl font-extrabold ' + (tone || '')}>{value}</div><div className="text-[11px] text-slate-500 mt-0.5">{label}</div></div>
}
export function ExportBtn({ onClick, label = 'Excel' }) {
  return <button data-testid="export-btn" onClick={onClick} className="text-[12px] font-semibold text-emerald-700 bg-emerald-50 rounded-full px-3 py-1.5 flex items-center gap-1"><Download size={13} />{label}</button>
}
export function Section({ title, action, children }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2 px-0.5"><div className="text-xs font-bold text-slate-600">{title}</div>{action}</div>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">{children}</div>
    </div>
  )
}
export function Row2({ a, b, bold }) {
  return <div className={'flex justify-between px-3.5 py-2.5 border-b border-slate-50 last:border-0 text-[13px] ' + (bold ? 'font-bold' : '')}><span className={bold ? 'text-slate-800' : 'text-slate-500'}>{a}</span><span className="text-slate-900">{b}</span></div>
}
export function Metric({ label, value, sub, tone = 'text-slate-900' }) {
  return <div className="bg-slate-50 rounded-xl p-2.5"><div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div><div className={'font-display text-base font-bold ' + tone}>{value}</div><div className="text-[10px] text-slate-400">{sub}</div></div>
}
export function FilterBar({ children }) {
  return <div className="flex flex-wrap gap-2 mb-3">{children}</div>
}
export function Search({ value, onChange, placeholder }) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || 'Search dealer…'}
    className="flex-1 min-w-[150px] border border-slate-200 rounded-lg px-3 py-2 bg-white text-[14px] outline-none focus:border-emerald-500" />
}
export function Pick({ value, onChange, options }) {
  return <select value={value} onChange={(e) => onChange(e.target.value)}
    className="border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-[13px] font-semibold text-slate-600 outline-none focus:border-emerald-500">
    {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
  </select>
}
export function SelPick({ value, onChange, options, label, testid }) {
  return (
    <select data-testid={testid} value={value} onChange={(e) => onChange(e.target.value)}
      className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-[12px] font-semibold text-slate-700 outline-none focus:border-emerald-500 max-w-[220px]">
      <option value="">{label}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}
export function Tag({ tone, children }) {
  const c = { green: 'bg-emerald-50 text-emerald-700', red: 'bg-red-50 text-red-700', amber: 'bg-amber-50 text-amber-800', slate: 'bg-slate-100 text-slate-600', blue: 'bg-sky-50 text-sky-700' }[tone || 'slate']
  return <span className={'text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ' + c}>{children}</span>
}
export function Bar({ pct, tone = 'bg-emerald-500' }) {
  return <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className={'h-full rounded-full ' + tone} style={{ width: Math.max(0, Math.min(100, pct)) + '%' }} /></div>
}
export function Delta({ v }) {
  if (v == null) return <span className="text-[11px] text-slate-400">new</span>
  return <span className={'text-[11px] font-bold ' + (v >= 0 ? 'text-emerald-700' : 'text-red-600')}>{v >= 0 ? '▲' : '▼'} {Math.abs(v)}%</span>
}
