import { useEffect, useState } from 'react'
import { Check, AlertCircle, Info } from 'lucide-react'

export default function Toaster() {
  const [toasts, setToasts] = useState([])
  useEffect(() => {
    const on = (e) => {
      const t = e.detail
      setToasts((ts) => [...ts, t])
      setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== t.id)), 3200)
    }
    window.addEventListener('toast', on)
    return () => window.removeEventListener('toast', on)
  }, [])
  return (
    <div className="fixed left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 items-center pointer-events-none"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 5.5rem)' }}>
      {toasts.map((t) => (
        <div key={t.id} className={'animate-slide-up flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-2xl shadow-lift text-[13px] font-semibold text-white max-w-[90vw] ring-1 ring-white/10 ' +
          (t.type === 'error' ? 'bg-red-600' : t.type === 'success' ? 'bg-brand-700' : 'bg-slate-800')}>
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/15 shrink-0">
            {t.type === 'error' ? <AlertCircle size={15} /> : t.type === 'success' ? <Check size={15} /> : <Info size={15} />}
          </span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
