import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../auth/AuthContext.jsx'

const NAV = {
  collector: [['/', 'Beat'], ['/stock', 'Stock'], ['/myday', 'My day']],
  staff: [['/', 'Overview'], ['/dealers', 'Dealers'], ['/stock', 'Stock'], ['/money', 'Money']],
}

export default function Shell() {
  const { auth, logout } = useAuth()
  const nav = useNavigate()
  const role = auth.user.role
  let tabs = [...(role === 'collector' ? NAV.collector : NAV.staff)]
  // Prices tab is always shown; access to individual lists is enforced per list.
  tabs.splice(tabs.length - 1, 0, ['/prices', 'Prices'])
  const subtitle = role === 'collector' ? 'Collector' : role === 'admin' ? 'Admin · Ashoka Distribution' : 'Manager · Ashoka Distribution'

  const onLogout = () => { logout(); nav('/') }

  return (
    <div className="min-h-screen bg-slate-300 flex justify-center p-3 font-sans">
      <div className="w-full max-w-md bg-slate-100 rounded-3xl shadow-2xl overflow-hidden flex flex-col min-h-[770px] relative">
        <div className="bg-slate-900 text-white px-5 py-3 flex justify-between items-center">
          <div>
            <div className="text-sm font-semibold">{auth.user.name}</div>
            <div className="text-[11px] text-slate-400">{subtitle}</div>
          </div>
          <button onClick={onLogout} className="text-slate-300"><LogOut size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-24">
          <Outlet />
        </div>

        <div className="absolute bottom-0 inset-x-0 bg-white border-t border-slate-200 flex py-2">
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
