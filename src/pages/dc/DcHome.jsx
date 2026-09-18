import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Plus, CalendarDays } from 'lucide-react'
import { api } from '../../api/client.js'
import { inr } from '../../lib/format.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { Spin } from '../../components/ui.jsx'
import { Hero, Stat, ModeBar, Section, ListCard, Row, today, niceDate } from './bits.jsx'
import { CORE, CRUD } from './modules.js'
import BillForm from './BillForm.jsx'

export default function DcHome() {
  const { auth } = useAuth()
  const nav = useNavigate()
  const admin = auth.user.role === 'admin'
  const [day, setDay] = useState(null)
  const [pend, setPend] = useState(null)
  const [bills, setBills] = useState(null)
  const [adding, setAdding] = useState(false)
  const from = new Date(Date.now() - 120 * 86400000).toISOString().slice(0, 10)
  const load = () => {
    api.dcDay(today()).then(setDay)
    api.dcPending('?frm=' + from + '&to=' + today()).then(setPend)
    api.dcBills('?date=' + today()).then((r) => setBills(r.rows || []))
  }
  useEffect(load, []) // eslint-disable-line
  if (!day) return <Spin />
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  return (
    <>
      <div className="mb-3">
        <div className="text-[12.5px] text-slate-500">{greet}, {auth.user.name.split(' ')[0]}</div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</h1>
      </div>

      <Hero eyebrow="Collected today" value={inr(day.total)} sub={day.bills + ' bills · ' + inr(day.expenses) + ' expenses'} testid="dc-home-hero"
        right={<button data-testid="dc-home-newbill" onClick={() => setAdding(true)} className="flex items-center gap-1 rounded-full bg-white text-slate-900 text-[12.5px] font-bold px-3.5 py-2 shadow hover:bg-brand-50 active:scale-95 transition-all"><Plus size={15} strokeWidth={2.6} />New bill</button>}>
        <ModeBar d={day} dark />
      </Hero>

      <div className="grid grid-cols-3 gap-2.5 mt-3">
        <Stat label="Pending" v={inr(pend?.total || 0)} sub={(pend?.count || 0) + ' bills'} tone="text-amber-600" testid="dc-home-pending" />
        <Stat label="In drawer" v={inr(day.expected_in_drawer)} sub="float + cash − exp." testid="dc-home-drawer" />
        {admin ? <Stat label="Profit" v={inr(day.profit || 0)} tone="text-emerald-600" sub="total − NLC" testid="dc-home-profit" /> : <Stat label="Cash" v={inr(day.cash_in)} testid="dc-home-cash" />}
      </div>

      <Section title="Quick actions">
        <div className="grid grid-cols-2 gap-2.5">
          {CORE.map(([to, l, Icon, hint, tone]) => (
            <button key={to} data-testid={'dc-quick-' + l.toLowerCase().replace(' ', '')} onClick={() => nav(to)}
              className="group text-left bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-soft hover:shadow-lift hover:-translate-y-0.5 transition-all">
              <div className={'h-9 w-9 rounded-xl flex items-center justify-center text-white mb-2.5 ' + tone}><Icon size={17} /></div>
              <div className="text-[14px] font-bold text-slate-900 flex items-center justify-between">{l}<ArrowRight size={14} className="text-slate-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" /></div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{hint}</div>
            </button>
          ))}
          <button data-testid="dc-quick-more" onClick={() => nav('/more')} className="text-left bg-slate-900 text-white rounded-2xl p-3.5 shadow-soft hover:-translate-y-0.5 transition-all">
            <div className="flex flex-wrap gap-1 mb-2.5">{Object.values(CRUD).slice(0, 6).map((m, i) => <span key={i} className={'h-3 w-3 rounded-full ' + m.tone} />)}</div>
            <div className="text-[14px] font-bold">{Object.keys(CRUD).length} more tools</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Reminders, price list, CRM…</div>
          </button>
          {admin && (
            <button data-testid="dc-quick-calendar" onClick={() => nav('/calendar')} className="group text-left bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-soft hover:shadow-lift hover:-translate-y-0.5 transition-all">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white mb-2.5 bg-brand-600"><CalendarDays size={17} /></div>
              <div className="text-[14px] font-bold text-slate-900 flex items-center justify-between">Month view<ArrowRight size={14} className="text-slate-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" /></div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">Heat-map of slow & strong days</div>
            </button>
          )}
        </div>
      </Section>

      <Section title="Recent bills" right={<button onClick={() => nav('/collections')} className="text-[12px] font-semibold text-brand-700">See all</button>}>
        {!bills ? <Spin /> : (
          <ListCard empty="No bills yet today. Tap New bill to start." testid="dc-home-recent">
            {bills.slice(0, 5).map((b) => (
              <Row key={b.id} title={(b.customer || 'Walk-in') + (b.bill_no ? ' · #' + b.bill_no : '')} sub={[b.staff, b.pending > 0 && 'pending ' + inr(b.pending)].filter(Boolean).join(' · ')}
                tone={b.pending > 0 ? 'bg-amber-400' : 'bg-emerald-500'} right={<div className="text-[14px] font-bold text-slate-900">{inr(b.total)}</div>} />
            ))}
          </ListCard>
        )}
      </Section>

      {pend?.rows?.length > 0 && (
        <Section title="Oldest pending" right={<button onClick={() => nav('/pending')} className="text-[12px] font-semibold text-brand-700">Collect</button>}>
          <ListCard>
            {pend.rows.slice(0, 3).map((b) => (
              <Row key={b.id} title={b.customer || 'Walk-in'} sub={niceDate(b.date) + (b.phone ? ' · ' + b.phone : '')} tone="bg-amber-400" onClick={() => nav('/pending')}
                right={<div className="text-[14px] font-bold text-amber-700">{inr(b.pending)}</div>} />
            ))}
          </ListCard>
        </Section>
      )}

      {adding && <BillForm date={today()} admin={admin} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); load() }} />}
    </>
  )
}
