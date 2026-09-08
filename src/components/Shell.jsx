import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { LogOut, LayoutDashboard, Store, Package, Tag, Wallet, ClipboardList, BarChart3, ClipboardCheck, FileBarChart, Users, ShoppingCart } from 'lucide-react'
import { useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useAuth } from '../auth/AuthContext.jsx'
import SyncStatus from './SyncStatus.jsx'

const ICONS = {
  '/': null, '/dealers': Store, '/stock': Package, '/prices': Tag, '/money': Wallet, '/myday': BarChart3,
}
const NAV = {
  collector: [['/', 'Beat', ClipboardList], ['/orders', 'Orders', ShoppingCart], ['/stock', 'Stock', Package], ['/myday', 'My day', BarChart3]],
  staff: [['/', 'Overview', LayoutDashboard], ['/dealers', 'Dealers', Store], ['/orders', 'Orders', ShoppingCart], ['/stock', 'Stock', Package], ['/money', 'Money', Wallet]],
}

export default function Shell() {
  const { auth, company, selectCompany, logout } = useAuth()
  const nav = useNavigate()
  const location = useLocation()
  const [refreshKey, setRefreshKey] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [pull, setPull] = useState(0)
  const startY = useRef(0); const pulling = useRef(false)
  const doRefresh = () => { setRefreshing(true); setRefreshKey((k) => k + 1); setTimeout(() => setRefreshing(false), 700) }
  const onTS = (e) => { const el = e.currentTarget; if (el.scrollTop <= 0) { startY.current = e.touches[0].clientY; pulling.current = true } }
  const onTM = (e) => { if (!pulling.current) return; const dy = e.touches[0].clientY - startY.current; if (dy > 0) setPull(Math.min(dy * 0.5, 80)) }
  const onTE = () => { if (!pulling.current) return; pulling.current = false; if (pull >= 60) doRefresh(); setPull(0) }
  const role = auth.user.role
  let tabs = [...(role === 'collector' ? NAV.collector : NAV.staff)]
  if (role === 'manager') tabs = tabs.filter(([to]) => to !== '/money')  // reconciliation is admin-only
  tabs.splice(tabs.length - 1, 0, ['/prices', 'Prices', Tag])
  if (role === 'admin') tabs.push(['/reconcile', 'Reconcile', ClipboardCheck])
  if (role === 'admin' || auth.user.can_view_reports) tabs.push(['/reports', 'Reports', FileBarChart])
  if (role === 'admin') tabs.push(['/users', 'Users', Users])
  const subtitle = role === 'collector' ? 'Collector' : role === 'admin' ? 'Admin' : 'Manager'
  const onLogout = () => { logout(); nav('/') }

  return (
    <div className="min-h-screen font-sans">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col shadow-2xl lg:h-screen lg:max-w-none lg:flex-row lg:overflow-hidden lg:shadow-none">

        {/* Desktop sidebar */}
        <aside className="hidden shrink-0 flex-col bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white lg:flex lg:h-screen lg:w-64 relative">
          <div className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-brand-500/20 blur-3xl" />
          <div className="px-5 py-5 border-b border-white/10 flex items-center gap-3 relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-extrabold text-lg shrink-0 shadow-glow">₹</div>
            <div className="min-w-0">
              <div className="font-display text-[15px] font-bold tracking-tight truncate">{company?.name || 'Ashoka Distribution'}</div>
              <button onClick={() => selectCompany(null)} className="text-[11px] text-brand-300 hover:text-brand-200 transition-colors">Switch company</button>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto p-3 space-y-1 relative">
            {tabs.map(([to, label, Icon]) => (
              <NavLink key={to} to={to} end
                className={({ isActive }) =>
                  'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ' +
                  (isActive ? 'bg-brand-600 text-white shadow-glow' : 'text-slate-300 hover:bg-white/[0.06] hover:text-white')}>
                {({ isActive }) => (
                  <>
                    <span className={'absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-white transition-opacity ' + (isActive ? 'opacity-100' : 'opacity-0')} />
                    {Icon && <Icon size={17} className="shrink-0" />}{label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="p-3 border-t border-white/10 relative">
            <div className="px-3 pb-2">
              <div className="text-sm font-semibold">{auth.user.name}</div>
              <div className="text-[11px] text-brand-300/80 font-semibold uppercase tracking-wide">{subtitle}</div>
            </div>
            <button onClick={onLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/[0.06] hover:text-white transition-colors">
              <LogOut size={16} />Log out
            </button>
          </div>
        </aside>

        {/* Mobile top bar */}
        <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-950 px-5 pb-3 text-white lg:hidden relative overflow-hidden"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}>
          <div className="pointer-events-none absolute -top-16 right-6 h-32 w-32 rounded-full bg-brand-500/20 blur-2xl" />
          <div className="relative flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-extrabold shrink-0">₹</div>
            <div>
              <div className="text-base font-semibold leading-tight">{auth.user.name}</div>
              <div className="text-[11px] text-slate-400">{subtitle} · {company?.name}<button onClick={() => selectCompany(null)} className="text-brand-300 ml-2">switch</button></div>
            </div>
          </div>
          <button onClick={onLogout} className="relative rounded-lg p-1.5 text-slate-300 active:bg-white/10"><LogOut size={19} /></button>
        </div>

        {/* Content */}
        <div className="flex min-h-0 flex-1 flex-col">
          <main onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE} className="flex-1 overflow-y-auto p-4 pb-28 lg:px-8 lg:py-8 lg:pb-8">
            <div className="flex items-end justify-center overflow-hidden lg:hidden" style={{ height: pull }}>
              {(pull > 0 || refreshing) && <RefreshCw size={20} className={'text-brand-500 mb-1 ' + (refreshing || pull >= 60 ? 'animate-spin' : '')} />}
            </div>
            <div className="mx-auto w-full max-w-2xl lg:max-w-4xl">
              <div className="flex items-center justify-end -mb-1">
                <button onClick={doRefresh} className="text-slate-400 hover:text-brand-600 p-1 transition-colors" title="Refresh">
                  <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                </button>
              </div>
              <SyncStatus />
              <div key={location.pathname + ':' + refreshKey} className="animate-fade-up"><Outlet /></div>
            </div>
          </main>
        </div>

        {/* Mobile bottom nav */}
        <div className={'fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-md border-t border-slate-200/80 bg-white/90 backdrop-blur-xl pt-1.5 shadow-[0_-8px_24px_-16px_rgba(15,23,42,.3)] lg:hidden ' + (tabs.length > 5 ? 'overflow-x-auto' : '')}
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.375rem)' }}>
          {tabs.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end
              className={({ isActive }) =>
                (tabs.length > 5 ? 'min-w-[4.6rem] shrink-0 ' : 'flex-1 ') +
                'relative flex flex-col items-center gap-0.5 py-1 text-[10.5px] font-semibold transition-colors ' + (isActive ? 'text-brand-700' : 'text-slate-400')}>
              {({ isActive }) => (
                <>
                  <span className={'absolute -top-1.5 h-1 w-8 rounded-full bg-brand-600 transition-all duration-300 ' + (isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-50')} />
                  {Icon && <Icon size={20} strokeWidth={isActive ? 2.5 : 2.1} />}
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  )
}
