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
        <div key={t.id} className={'flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-[13px] font-semibold text-white max-w-[90vw] ' +
          (t.type === 'error' ? 'bg-red-600' : t.type === 'success' ? 'bg-emerald-700' : 'bg-slate-800')}>
          {t.type === 'error' ? <AlertCircle size={16} /> : t.type === 'success' ? <Check size={16} /> : <Info size={16} />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
