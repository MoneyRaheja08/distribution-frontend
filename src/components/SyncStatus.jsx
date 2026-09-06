import { useEffect, useState } from 'react'
import { getLastSync } from '../api/client.js'

const ago = (t) => {
  if (!t) return 'loading…'
  const s = Math.floor((Date.now() - t) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return m + 'm ago'
  return Math.floor(m / 60) + 'h ago'
}

export default function SyncStatus() {
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [, tick] = useState(0)
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false), bump = () => tick((t) => t + 1)
    window.addEventListener('online', on); window.addEventListener('offline', off); window.addEventListener('api:sync', bump)
    const iv = setInterval(bump, 30000)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); window.removeEventListener('api:sync', bump); clearInterval(iv) }
  }, [])
  if (!online) {
    return <div className="bg-red-600 text-white text-[12px] font-semibold text-center py-1.5">You're offline — showing last loaded data</div>
  }
  return <div className="text-[11px] text-slate-400 text-right px-1 -mt-1 mb-2">Updated {ago(getLastSync())}</div>
}
