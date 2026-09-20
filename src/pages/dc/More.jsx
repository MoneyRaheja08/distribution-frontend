import { useNavigate } from 'react-router-dom'
import { ArrowRight, Users, HandCoins, Repeat, ShieldCheck, ListChecks } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext.jsx'
import { PageHead } from './bits.jsx'
import { CORE, CRUD } from './modules.js'

export default function More() {
  const nav = useNavigate()
  const { auth } = useAuth()
  const admin = auth.user.role === 'admin'
  const seesAll = ['admin', 'manager'].includes(auth.user.role)
  const Tile = ({ to, title, hint, icon: Icon, tone, testid }) => (
    <button data-testid={testid} onClick={() => nav(to)} className="group text-left bg-white border border-slate-200/80 rounded-2xl p-4 shadow-soft hover:shadow-lift hover:-translate-y-0.5 transition-all">
      <div className={'h-10 w-10 rounded-xl flex items-center justify-center text-white mb-3 ' + tone}><Icon size={18} /></div>
      <div className="text-[14px] font-bold text-slate-900 flex items-center justify-between">{title}<ArrowRight size={14} className="text-slate-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" /></div>
      <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{hint}</div>
    </button>
  )
  return (
    <>
      <PageHead title="All tools" sub="Everything in your shop, one tap away" />
      <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 mb-2 px-0.5">Daily</div>
      <div className="grid grid-cols-2 gap-2.5 mb-6">
        {CORE.map(([to, l, Icon, hint, tone]) => <Tile key={to} to={to} title={l} hint={hint} icon={Icon} tone={tone} testid={'dc-more-' + to.slice(1)} />)}
        <Tile to="/cash" title="Cash in hand" hint={admin ? 'Every staff drawer & handovers' : 'Your live cash drawer'} icon={HandCoins} tone="bg-emerald-600" testid="dc-more-cash" />
        <Tile to="/exchanges" title="Exchange" hint="Trade-ins, resale & Godown-1" icon={Repeat} tone="bg-fuchsia-500" testid="dc-more-exchanges" />
      </div>
      <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 mb-2 px-0.5">Registers</div>
      <div className="grid grid-cols-2 gap-2.5">
        {Object.entries(CRUD).map(([k, m]) => <Tile key={k} to={'/m/' + k} title={m.title} hint={m.hint} icon={m.icon} tone={m.tone} testid={'dc-mod-' + k} />)}
      </div>
      {(admin || seesAll) && (
        <>
          <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 mb-2 mt-6 px-0.5">Admin</div>
          <div className="grid grid-cols-2 gap-2.5">
            {admin && <Tile to="/verify" title="Verify" hint="Approve big expenses & resales" icon={ShieldCheck} tone="bg-rose-600" testid="dc-more-verify" />}
            {seesAll && <Tile to="/reconcile" title="Reconcile" hint="Tick off bills & find missing numbers" icon={ListChecks} tone="bg-teal-600" testid="dc-more-reconcile" />}
            {admin && <Tile to="/users" title="Staff" hint="Manage logins, PINs & roles" icon={Users} tone="bg-indigo-500" testid="dc-more-users" />}
          </div>
        </>
      )}
    </>
  )
}
