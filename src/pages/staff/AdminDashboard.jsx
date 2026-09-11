import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Wallet, AlertTriangle, Package, Target, UserX, FileClock, ClipboardCheck, ArrowRight } from 'lucide-react'
import { api } from '../../api/client.js'
import { inr } from '../../lib/format.js'
import { Spin } from '../../components/ui.jsx'
import { Bar, Tag } from '../../components/reportBits.jsx'

function Tile({ icon: Icon, label, value, sub, tone = 'text-slate-900', onClick, testid }) {
  return (
    <button data-testid={testid} onClick={onClick} className="text-left bg-white border border-slate-200/70 rounded-2xl p-4 shadow-soft hover:shadow-lift hover:-translate-y-0.5 transition-all">
      <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-slate-400"><Icon size={13} />{label}</div>
      <div className={'font-display text-2xl font-bold tracking-tight mt-1.5 ' + tone}>{value}</div>
      {sub && <div className="text-[11.5px] text-slate-400 mt-0.5">{sub}</div>}
    </button>
  )
}
function Panel({ title, action, children, testid }) {
  return (
    <div data-testid={testid} className="bg-white border border-slate-200/70 rounded-2xl shadow-soft overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center"><h2 className="font-display text-[14px] font-bold text-slate-800">{title}</h2>{action}</div>
      <div className="px-4 py-2">{children}</div>
    </div>
  )
}
function Line({ a, b, sub, tone }) {
  return <div className="flex justify-between items-baseline py-2 border-b border-slate-50 last:border-0 text-[13px]"><div className="min-w-0"><div className="font-semibold text-slate-800 truncate">{a}</div>{sub && <div className="text-[11px] text-slate-400">{sub}</div>}</div><div className={'font-bold shrink-0 pl-2 ' + (tone || 'text-slate-900')}>{b}</div></div>
}
const Go = ({ to, label = 'Open' }) => { const nav = useNavigate(); return <button onClick={() => nav(to)} className="text-[11px] font-semibold text-emerald-700 flex items-center gap-0.5">{label}<ArrowRight size={12} /></button> }

export default function AdminDashboard() {
  const nav = useNavigate()
  const [d, setD] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => { api.dashboard().then(setD).catch((e) => setErr(e.message)) }, [])
  if (err) return <div className="text-red-600 text-sm">{err}</div>
  if (!d) return <Spin />
  const t = d.today, m = d.mtd
  return (
    <>
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>
        <span className="text-[12px] text-slate-400">{d.date}</span>
      </div>

      {(d.cheque_alerts.due_today.length > 0 || d.cheque_alerts.overdue.length > 0) && (
        <div data-testid="dash-cheque-alert" className="mb-4 bg-sky-50 border border-sky-200 rounded-2xl px-4 py-3">
          <div className="flex justify-between items-center mb-1.5">
            <div className="text-[14px] font-bold text-sky-900 flex items-center gap-2"><FileClock size={16} /> Cheques to deposit today</div>
            <button onClick={() => nav('/money')} className="text-[11px] font-semibold text-sky-700">Open Money →</button>
          </div>
          {d.cheque_alerts.due_today.map((c, i) => <div key={'t' + i} className="flex justify-between text-[13px] py-1 border-t border-sky-100"><span className="text-sky-900"><b>{c.dealer}</b> · {c.cheque || 'cheque'} · dated today</span><span className="font-bold text-sky-900">{inr(c.amount)}</span></div>)}
          {d.cheque_alerts.overdue.map((c, i) => <div key={'o' + i} className="flex justify-between text-[13px] py-1 border-t border-sky-100"><span className="text-red-700"><b>{c.dealer}</b> · {c.cheque || 'cheque'} · dated {c.cheque_date}, still not deposited</span><span className="font-bold text-red-700">{inr(c.amount)}</span></div>)}
          <div className="text-[11px] text-sky-700 mt-1.5">Due today {inr(d.cheque_alerts.due_today_total)}{d.cheque_alerts.overdue_total > 0 ? ` · past date ${inr(d.cheque_alerts.overdue_total)}` : ''}</div>
        </div>
      )}
      {d.schemes.alerts.length > 0 && (
        <div data-testid="dash-scheme-alert" className="mb-4 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
          <div className="flex justify-between items-center mb-1.5">
            <div className="text-[14px] font-bold text-red-900 flex items-center gap-2"><Target size={16} /> {d.schemes.alerts.length} scheme(s) behind pace · month {d.schemes.progress}% done</div>
            <button onClick={() => nav('/reports')} className="text-[11px] font-semibold text-red-700">Tracker →</button>
          </div>
          {d.schemes.alerts.map((x, i) => <div key={i} className="flex justify-between text-[13px] py-1 border-t border-red-100"><span className="text-red-900"><b>{x.label}</b> · {x.achieved_pct}% · push {x.gap_qty ? x.gap_qty + ' more units' : inr(x.gap_amount) + ' more'} ({x.basis}s)</span><span className="font-bold text-red-900">{inr(x.potential)}</span></div>)}
        </div>
      )}
      {(d.pending_approvals > 0 || d.cheques.due > 0) && (
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          {d.pending_approvals > 0 && <button data-testid="dash-approvals" onClick={() => nav('/approvals')} className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex justify-between items-center text-left"><div><div className="text-[14px] font-bold text-amber-800">{d.pending_approvals} payment(s) awaiting approval</div><div className="text-[11px] text-amber-700">Tap to review</div></div><ClipboardCheck className="text-amber-700" size={18} /></button>}
          {d.cheques.due > 0 && <button data-testid="dash-cheques-due" onClick={() => nav('/money')} className="bg-sky-50 border border-sky-200 rounded-2xl px-4 py-3 flex justify-between items-center text-left"><div><div className="text-[14px] font-bold text-sky-800">{inr(d.cheques.due)} in cheques ready to clear</div><div className="text-[11px] text-sky-700">{inr(d.cheques.future)} post-dated, not yet due</div></div><FileClock className="text-sky-700" size={18} /></button>}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4 stagger">
        <Tile testid="dash-today-sales" icon={TrendingUp} label="Sales today" value={inr(t.sales.amount)} sub={t.sales.units + ' units · margin ' + inr(t.sales.margin)} tone="text-emerald-700" onClick={() => nav('/reports')} />
        <Tile testid="dash-today-coll" icon={Wallet} label="Collected today" value={inr(t.collections)} sub={'MTD ' + inr(m.collections)} onClick={() => nav('/money')} />
        <Tile testid="dash-mtd-sales" icon={TrendingUp} label="Sales this month" value={inr(m.sales.amount)} sub={`${m.sales.units} units · GM ${m.sales.margin_pct}% (${inr(m.sales.margin)})`} onClick={() => nav('/reports')} />
        <Tile testid="dash-outstanding" icon={AlertTriangle} label="Outstanding" value={inr(d.outstanding)} sub={'90+ days ' + inr(d.over90)} tone={d.over90 > 0 ? 'text-red-600' : 'text-slate-900'} onClick={() => nav('/reports')} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5 stagger">
        <Tile testid="dash-forecast" icon={Wallet} label="Cash expected · 7 d" value={inr(d.forecast.week1)} sub={'next 30 d ' + inr(d.forecast.next30)} tone="text-emerald-700" onClick={() => nav('/reports')} />
        <Tile testid="dash-risk" icon={AlertTriangle} label="At-risk receivables" value={inr(d.forecast.at_risk)} sub="45 d past usual pay time" tone={d.forecast.at_risk > 0 ? 'text-red-600' : 'text-slate-900'} onClick={() => nav('/reports')} />
        <Tile testid="dash-stock" icon={Package} label="Stock on hand" value={inr(d.stock.value)} sub={d.stock.units + ' units · ' + d.low_stock.length + ' low'} onClick={() => nav('/stock')} />
        <Tile testid="dash-schemes" icon={Target} label="Scheme earned" value={inr(d.schemes.earned)} sub={'potential ' + inr(d.schemes.potential) + ' · month ' + d.schemes.progress + '%'} tone="text-emerald-700" onClick={() => nav('/reports')} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Dealers paying slower" testid="dash-slowing" action={<Go to="/reports" />}>
          {d.slowing.length === 0 ? <div className="text-[12px] text-slate-400 py-3">No dealer is slowing down. Good.</div>
            : d.slowing.map((x, i) => <Line key={i} a={x.name} sub={`now ${x.latest} d · +${x.change} d vs before`} b={inr(x.outstanding)} tone="text-red-600" />)}
        </Panel>
        <Panel title="Top overdue" testid="dash-overdue" action={<Go to="/reports" />}>
          {d.top_overdue.length === 0 ? <div className="text-[12px] text-slate-400 py-3">Nothing overdue.</div>
            : d.top_overdue.map((x, i) => <Line key={i} a={x.dealer} sub={x.age_90p ? inr(x.age_90p) + ' over 90 days' : ''} b={inr(x.outstanding)} />)}
        </Panel>
        <Panel title="Scheme achievement this month" testid="dash-scheme-rows" action={<Go to="/reports" label="Tracker" />}>
          {d.schemes.rows.length === 0 ? <div className="text-[12px] text-slate-400 py-3">No schemes set. Add Haier targets in Reports → Scheme tracker.</div>
            : d.schemes.rows.map((x, i) => (
              <div key={i} className="py-2 border-b border-slate-50 last:border-0">
                <div className="flex justify-between text-[13px] mb-1"><span className="font-semibold text-slate-800 truncate">{x.label}</span><span className="font-bold shrink-0">{x.achieved_pct}% {x.met && <Tag tone="green">met</Tag>}</span></div>
                <Bar pct={x.achieved_pct} tone={x.met ? 'bg-emerald-500' : x.achieved_pct >= d.schemes.progress ? 'bg-sky-500' : 'bg-amber-400'} />
                {!x.met && <div className="text-[10px] text-slate-400 mt-0.5">need {x.gap_qty ? x.gap_qty + ' more units' : inr(x.gap_amount) + ' more'}</div>}
              </div>
            ))}
        </Panel>
        <Panel title="Low stock (sold in 30 d, ≤2 left)" testid="dash-low-stock" action={<Go to="/stock" />}>
          {d.low_stock.length === 0 ? <div className="text-[12px] text-slate-400 py-3">No low-stock alerts.</div>
            : d.low_stock.map((x, i) => <Line key={i} a={x.model} b={x.on_hand + ' left'} sub={x.sold_30d + ' sold in 30 d'} tone={x.on_hand === 0 ? 'text-red-600' : 'text-amber-700'} />)}
        </Panel>
        <Panel title={`Lost dealers · ${d.inactive.count} inactive 30+ d`} testid="dash-inactive" action={<Go to="/reports" />}>
          {d.inactive.rows.length === 0 ? <div className="text-[12px] text-slate-400 py-3">Everyone bought recently.</div>
            : <>{d.inactive.rows.map((x, i) => <Line key={i} a={x.name} sub={`${x.days_since} days since last bill`} b={inr(x.run_rate) + '/mo'} />)}
              {d.inactive.lost_revenue > 0 && <div className="text-[11px] text-red-600 pt-2">≈ {inr(d.inactive.lost_revenue)} revenue lost · {d.inactive.regular_lost} were regular buyers</div>}</>}
        </Panel>
        <Panel title="Top dealers this month" testid="dash-top-dealers" action={<Go to="/reports" />}>
          {m.top_dealers.length === 0 ? <div className="text-[12px] text-slate-400 py-3">No sales yet this month.</div>
            : m.top_dealers.map((x, i) => <Line key={i} a={x.dealer} b={inr(x.amount)} />)}
        </Panel>
        <Panel title="Cheques in hand" testid="dash-cheque-rows" action={<Go to="/money" />}>
          {d.cheques.rows.length === 0 ? <div className="text-[12px] text-slate-400 py-3">No pending cheques.</div>
            : d.cheques.rows.map((x, i) => <Line key={i} a={x.dealer} sub={(x.cheque || 'cheque') + (x.cheque_date ? ' · dated ' + x.cheque_date : '')} b={inr(x.amount)} tone={x.due ? 'text-emerald-700' : 'text-slate-500'} />)}
        </Panel>
      </div>
    </>
  )
}
