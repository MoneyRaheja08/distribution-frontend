import { useEffect, useState } from 'react'
import { _resolveConfirm } from '../lib/confirm.js'

export default function ConfirmHost() {
  const [state, setState] = useState(null)
  useEffect(() => {
    const on = (e) => setState(e.detail)
    window.addEventListener('confirm:open', on)
    return () => window.removeEventListener('confirm:open', on)
  }, [])
  if (!state) return null
  const close = (v) => { _resolveConfirm(v); setState(null) }
  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-[60] p-6"
      onClick={(e) => e.target === e.currentTarget && close(false)}>
      <div className="bg-white rounded-2xl p-5 max-w-xs w-full shadow-2xl">
        <div className="text-[14px] text-slate-800 leading-relaxed mb-4">{state.message}</div>
        <div className="flex gap-2">
          <button onClick={() => close(false)} className="flex-1 border border-slate-200 text-slate-600 font-semibold py-2.5 rounded-xl text-[13px]">Cancel</button>
          <button onClick={() => close(true)} className={'flex-1 text-white font-semibold py-2.5 rounded-xl text-[13px] ' + (state.danger ? 'bg-red-600' : 'bg-emerald-700')}>{state.confirmLabel || 'Confirm'}</button>
        </div>
      </div>
    </div>
  )
}
