import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LogOut, LayoutDashboard, Store, Package, Tag, Wallet, ClipboardList, BarChart3 } from 'lucide-react'
import { useAuth } from '../auth/AuthContext.jsx'

const ICONS = {
  '/': null, '/dealers': Store, '/stock': Package, '/prices': Tag, '/money': Wallet, '/myday': BarChart3,
}
const NAV = {
  collector: [['/', 'Beat', ClipboardList], ['/stock', 'Stock', Package], ['/myday', 'My day', BarChart3]],
  staff: [['/', 'Overview', LayoutDashboard], ['/dealers', 'Dealers', Store], ['/stock', 'Stock', Package], ['/money', 'Money', Wallet]],
}

export default function Shell() {
  const { auth, logout } = useAuth()
  const nav = useNavigate()
  const role = auth.user.role
  let tabs = [...(role === 'collector' ? NAV.collector : NAV.staff)]
  tabs.splice(tabs.length - 1, 0, ['/prices', 'Prices', Tag])
  const subtitle = role === 'collector' ? 'Collector' : role === 'admin' ? 'Admin' : 'Manager'
  const onLogout = () => { logout(); nav('/') }

  return (
    <div className="min-h-screen bg-slate-200 font-sans lg:bg-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-slate-100 shadow-2xl lg:max-w-none lg:flex-row lg:shadow-none">

        {/* Desktop sidebar */}
        <aside className="hidden shrink-0 flex-col bg-slate-900 text-white lg:flex lg:w-64">
          <div className="px-5 py-5 border-b border-white/10">
            <div className="text-base font-extrabold tracking-tight">Ashoka Distribution</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Collections &amp; stock</div>
          </div>
          <nav className="flex-1 p-3 space-y-1">
            {tabs.map(([to, label, Icon]) => (
              <NavLink key={to} to={to} end
                className={({ isActive }) =>
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ' +
                  (isActive ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white')}>
                {Icon && <Icon size={17} />}{label}
              </NavLink>
            ))}
          </nav>
          <div className="p-3 border-t border-white/10">
            <div className="px-3 pb-2">
              <div className="text-sm font-semibold">{auth.user.name}</div>
              <div className="text-[11px] text-slate-400">{subtitle}</div>
            </div>
            <button onClick={onLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white">
              <LogOut size={16} />Log out
            </button>
          </div>
        </aside>

        {/* Mobile top bar */}
        <div className="flex items-center justify-between bg-slate-900 px-5 py-3 text-white lg:hidden">
          <div>
            <div className="text-sm font-semibold">{auth.user.name}</div>
            <div className="text-[11px] text-slate-400">{subtitle} · Ashoka Distribution</div>
          </div>
          <button onClick={onLogout} className="text-slate-300"><LogOut size={18} /></button>
        </div>

        {/* Content */}
        <div className="flex min-h-0 flex-1 flex-col">
          <main className="flex-1 overflow-y-auto p-4 pb-24 lg:px-8 lg:py-8 lg:pb-8">
            <div className="mx-auto w-full max-w-2xl lg:max-w-4xl">
              <Outlet />
            </div>
          </main>
        </div>

        {/* Mobile bottom nav */}
        <div className="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-md border-t border-slate-200 bg-white py-2 lg:hidden">
          {tabs.map(([to, label]) => (
            <NavLink key={to} to={to} end
              className={({ isActive }) =>
                'flex-1 text-center text-[11px] font-semibold py-1 ' + (isActive ? 'text-emerald-700' : 'text-slate-500')}>
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  )
}
