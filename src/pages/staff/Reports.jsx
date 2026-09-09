import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { api } from '../../api/client.js'
import { inr } from '../../lib/format.js'
import { exportSheet } from '../../lib/excel.js'
import { renderTableImage } from '../../lib/tableImage.js'
import { shareImage } from '../../lib/share.js'
import { toast } from '../../lib/toast.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { Spin, BackBtn, Card, SkeletonList } from '../../components/ui.jsx'

const monthStart = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01` }
const today = () => new Date().toISOString().slice(0, 10)



export default function Reports() {
  const [tab, setTab] = useState('collections')
  const [from, setFrom] = useState(monthStart())
  const [to, setTo] = useState(today())

  return (
    <>
      <BackBtn label="Overview" />
      <div className="text-xs font-bold text-slate-600 mb-2.5 px-0.5">Reports</div>

      <div className="flex gap-1.5 mb-3 overflow-x-auto">
        {[['collections', 'Collections'], ['ageing', 'Ageing'], ['billage', 'Bill ageing'], ['billspdf', 'PDF bills'], ['sales', 'Dealer × Model'], ['purchases', 'Brand buys'], ['profit', 'Profit'], ['profit2', 'Profit 2 · Real'], ['scorecard', 'Scorecard'], ['top', 'Top performers'], ['activity', 'Activity'], ['svc', 'Sales vs Coll']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={'whitespace-nowrap text-[13px] font-semibold px-3.5 py-2 rounded-lg border ' +
              (tab === k ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500')}>{l}</button>
        ))}
      </div>

      {tab !== 'ageing' && tab !== 'billage' && (
        <div className="flex items-end gap-2 mb-4 bg-white border border-slate-200 rounded-xl p-3">
          <label className="flex-1 text-[11px] font-semibold text-slate-500">From
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-lg px-2 py-2 text-[13px]" /></label>
          <label className="flex-1 text-[11px] font-semibold text-slate-500">To
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-lg px-2 py-2 text-[13px]" /></label>
        </div>
      )}

      {tab === 'collections' && <Collections from={from} to={to} />}
      {tab === 'ageing' && <Ageing />}
      {tab === 'activity' && <Activity from={from} to={to} />}
      {tab === 'billage' && <BillAgeing />}
      {tab === 'billspdf' && <PdfBills from={from} to={to} />}
      {tab === 'sales' && <SalesReport from={from} to={to} />}
      {tab === 'purchases' && <PurchaseBrandReport from={from} to={to} />}
      {tab === 'profit' && <ProfitReport from={from} to={to} />}
      {tab === 'profit2' && <Profit2 from={from} to={to} />}
      {tab === 'scorecard' && <BrandScorecard from={from} to={to} />}
      {tab === 'top' && <TopPerformers from={from} to={to} />}
      {tab === 'svc' && <SalesVsColl from={from} to={to} />}
    </>
  )
}

function Big({ label, value }) {
  return <div className="bg-white border border-slate-200 rounded-xl p-4 mb-3"><div className="text-2xl font-extrabold">{value}</div><div className="text-[11px] text-slate-500 mt-0.5">{label}</div></div>
}
function ExportBtn({ onClick }) {
  return <button onClick={onClick} className="text-[12px] font-semibold text-emerald-700 bg-emerald-50 rounded-full px-3 py-1.5 flex items-center gap-1"><Download size={13} />Excel</button>
}
function Section({ title, action, children }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2 px-0.5"><div className="text-xs font-bold text-slate-600">{title}</div>{action}</div>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">{children}</div>
    </div>
  )
}
function Row2({ a, b, bold }) {
  return <div className={'flex justify-between px-3.5 py-2.5 border-b border-slate-50 last:border-0 text-[13px] ' + (bold ? 'font-bold' : '')}><span className={bold ? 'text-slate-800' : 'text-slate-500'}>{a}</span><span className="text-slate-900">{b}</span></div>
}

const BUCKET_LABEL = { age_0_30: '0–30', age_31_60: '31–60', age_61_90: '61–90', age_90p: '90+' }
const BUCKET_OPTS = [['All', 'All ages'], ['age_0_30', '0–30'], ['age_31_60', '31–60'], ['age_61_90', '61–90'], ['age_90p', '90+']]

function FilterBar({ children }) {
  return <div className="flex flex-wrap gap-2 mb-3">{children}</div>
}
function Search({ value, onChange, placeholder }) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || 'Search dealer…'}
    className="flex-1 min-w-[150px] border border-slate-200 rounded-lg px-3 py-2 bg-white text-[14px] outline-none focus:border-emerald-500" />
}
function Pick({ value, onChange, options }) {
  return <select value={value} onChange={(e) => onChange(e.target.value)}
    className="border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-[13px] font-semibold text-slate-600 outline-none focus:border-emerald-500">
    {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
  </select>
}

function Collections({ from, to }) {
  const [r, setR] = useState(null)
  const [coll, setColl] = useState('All')
  useEffect(() => { setR(null); setColl('All'); api.reportCollections(from, to).then(setR) }, [from, to])
  if (!r) return <SkeletonList rows={5} />
  const allRows = r.rows || []
  const collectors = ['All', ...Array.from(new Set(allRows.map((x) => x.collector || '—')))]
  const rows = coll === 'All' ? allRows : allRows.filter((x) => (x.collector || '—') === coll)
  const total = rows.reduce((s, x) => s + x.amount, 0)
  const byMode = {}; rows.forEach((x) => { byMode[x.mode] = (byMode[x.mode] || 0) + x.amount })
  const bc = {}; rows.forEach((x) => { const k = x.collector || '—'; bc[k] = bc[k] || { amount: 0, count: 0 }; bc[k].amount += x.amount; bc[k].count++ })
  const byColl = Object.entries(bc).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.amount - a.amount)
  return (
    <>
      <FilterBar><Pick value={coll} onChange={setColl} options={collectors.map((n) => [n, n === 'All' ? 'All collectors' : n])} /></FilterBar>
      <Big label={`Total collected · ${from} to ${to}`} value={inr(total)} />
      <Section title="By mode" action={<ExportBtn onClick={() => exportSheet('collections-by-mode.xlsx', [['Mode', 'Amount'], ...Object.entries(byMode).map(([m, v]) => [m, v]), ['Total', total]], { money: [1], sheet: 'By mode' })} />}>
        {Object.keys(byMode).length === 0 ? <Row2 a="No collections in range" b="" /> : Object.entries(byMode).map(([m, v]) => <Row2 key={m} a={m} b={inr(v)} />)}
      </Section>
      <Section title="By collector" action={<ExportBtn onClick={() => exportSheet('collections-by-collector.xlsx', [['Collector', 'Receipts', 'Amount'], ...byColl.map((c) => [c.name, c.count, c.amount])], { money: [2], sheet: 'By collector' })} />}>
        {byColl.length === 0 ? <Row2 a="No collections in range" b="" /> : byColl.map((c) => <Row2 key={c.name} a={`${c.name} · ${c.count}`} b={inr(c.amount)} />)}
      </Section>
      <Section title="All entries" action={<ExportBtn onClick={() => exportSheet('collections.xlsx', [['Date', 'Dealer', 'Mode', 'Collector', 'Amount'], ...rows.map((x) => [x.date, x.dealer, x.mode, x.collector, x.amount])], { money: [4], sheet: 'Collections' })} />}>
        {rows.length === 0 ? <Row2 a="No collections in range" b="" /> : rows.map((x, i) => (
          <div key={i} className="px-3.5 py-2.5 border-b border-slate-50 last:border-0">
            <div className="flex justify-between text-[13px]"><span className="font-semibold text-slate-800 truncate pr-2">{x.dealer}</span><span className="font-bold text-emerald-700 shrink-0">{inr(x.amount)}</span></div>
            <div className="text-[11px] text-slate-500 mt-0.5">{x.mode} · {x.collector} · {x.date}</div>
          </div>
        ))}
      </Section>
    </>
  )
}

function Ageing() {
  const [r, setR] = useState(null)
  const [q, setQ] = useState('')
  const [bucket, setBucket] = useState('All')
  useEffect(() => { api.reportAgeing().then(setR) }, [])
  if (!r) return <SkeletonList rows={5} />
  const AG = [['age_0_30', '0–30 days'], ['age_31_60', '31–60 days'], ['age_61_90', '61–90 days'], ['age_90p', '90+ days']]
  const dealers = (r.dealers || []).filter((d) => (!q || d.name.toLowerCase().includes(q.toLowerCase())) && (bucket === 'All' || (d[bucket] || 0) > 0))
  return (
    <>
      <Big label="Total outstanding" value={inr(r.total_outstanding)} />
      <Section title="By age" action={<ExportBtn onClick={() => exportSheet('ageing.xlsx', [['Bucket', 'Amount'], ...AG.map(([k, l]) => [l, r.ageing[k] || 0]), ['Total', r.total_outstanding]], { money: [1], sheet: 'Ageing' })} />}>
        {AG.map(([k, l]) => <Row2 key={k} a={l} b={inr(r.ageing[k] || 0)} />)}
      </Section>
      <Section title="Worst overdue (90+ first)" action={<ExportBtn onClick={() => exportSheet('top-overdue.xlsx', [['Dealer', 'Outstanding', '90+ days'], ...r.top_overdue.map((d) => [d.name, d.outstanding, d.age_90p])], { money: [1, 2], sheet: 'Top overdue' })} />}>
        {r.top_overdue.length === 0 ? <Row2 a="Nothing overdue" b="" /> : r.top_overdue.map((d) => (
          <div key={d.name} className="flex justify-between px-3.5 py-2.5 border-b border-slate-50 last:border-0 text-[13px]">
            <div className="min-w-0"><div className="font-semibold text-slate-800 truncate">{d.name}</div>{d.age_90p > 0 && <div className="text-[11px] text-red-600">{inr(d.age_90p)} over 90 days</div>}</div>
            <div className="font-bold text-slate-900 shrink-0 pl-2">{inr(d.outstanding)}</div>
          </div>
        ))}
      </Section>
      {r.over_limit.length > 0 && (
        <Section title="Over credit limit" action={<ExportBtn onClick={() => exportSheet('over-limit.xlsx', [['Dealer', 'Outstanding', 'Limit'], ...r.over_limit.map((d) => [d.name, d.outstanding, d.limit])], { money: [1, 2], sheet: 'Over limit' })} />}>
          {r.over_limit.map((d) => <Row2 key={d.name} a={d.name} b={`${inr(d.outstanding)} / ${inr(d.limit)}`} />)}
        </Section>
      )}
      <div className="text-xs font-bold text-slate-600 mb-2 px-0.5">Dealer-wise ageing</div>
      <FilterBar><Search value={q} onChange={setQ} /><Pick value={bucket} onChange={setBucket} options={BUCKET_OPTS} /></FilterBar>
      <Section title={dealers.length + ' dealers'} action={<ExportBtn onClick={() => exportSheet('dealer-ageing.xlsx', [['Dealer', '0-30', '31-60', '61-90', '90+', 'Outstanding'], ...dealers.map((d) => [d.name, d.age_0_30, d.age_31_60, d.age_61_90, d.age_90p, d.outstanding])], { money: [1, 2, 3, 4, 5], sheet: 'Dealer ageing' })} />}>
        {dealers.length === 0 ? <Row2 a="No dealers match" b="" /> : dealers.map((d) => (
          <div key={d.name} className="px-3.5 py-2.5 border-b border-slate-50 last:border-0">
            <div className="flex justify-between text-[13px]"><span className="font-semibold text-slate-800 truncate pr-2">{d.name}</span><span className="font-bold text-slate-900 shrink-0">{inr(d.outstanding)}</span></div>
            <div className="text-[11px] text-slate-500 mt-0.5">0–30 {inr(d.age_0_30)} · 31–60 {inr(d.age_31_60)} · 61–90 {inr(d.age_61_90)} · <span className={d.age_90p > 0 ? 'text-red-600 font-semibold' : ''}>90+ {inr(d.age_90p)}</span></div>
          </div>
        ))}
      </Section>
    </>
  )
}

function SalesVsColl({ from, to }) {
  const [r, setR] = useState(null)
  const [q, setQ] = useState('')
  useEffect(() => { setR(null); setQ(''); api.reportSalesVsColl(from, to).then(setR) }, [from, to])
  if (!r) return <SkeletonList rows={5} />
  const rows = r.rows.filter((x) => !q || x.name.toLowerCase().includes(q.toLowerCase()))
  const ts = rows.reduce((s, x) => s + x.sales, 0), tc = rows.reduce((s, x) => s + x.collected, 0)
  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <Card n={inr(ts)} l="Total billed (sales)" />
        <Card n={inr(tc)} l="Total collected" />
      </div>
      <FilterBar><Search value={q} onChange={setQ} /></FilterBar>
      <Section title={`Per dealer · ${from} to ${to}`}
        action={<ExportBtn onClick={() => exportSheet('sales-vs-collection.xlsx', [['Dealer', 'Sales', 'Collected', 'Net (sales-coll)'], ...rows.map((x) => [x.name, x.sales, x.collected, x.net])], { money: [1, 2, 3], sheet: 'Sales vs Collection' })} />}>
        {rows.length === 0 ? <Row2 a="No dealers match" b="" /> : rows.map((x) => (
          <div key={x.name} className="px-3.5 py-2.5 border-b border-slate-50 last:border-0">
            <div className="flex justify-between text-[13px]"><span className="font-semibold text-slate-800 truncate pr-2">{x.name}</span>
              <span className={'font-bold shrink-0 ' + (x.net > 0 ? 'text-red-600' : 'text-emerald-700')}>{x.net > 0 ? '+' : ''}{inr(x.net)}</span></div>
            <div className="text-[11px] text-slate-500 mt-0.5">Billed {inr(x.sales)} · Collected {inr(x.collected)}</div>
          </div>
        ))}
      </Section>
    </>
  )
}

function Activity({ from, to }) {
  const [r, setR] = useState(null)
  const [coll, setColl] = useState('All')
  useEffect(() => { setR(null); setColl('All'); api.reportActivity(from, to).then(setR) }, [from, to])
  if (!r) return <SkeletonList rows={5} />
  const names = ['All', ...r.rows.map((x) => x.name)]
  const rows = coll === 'All' ? r.rows : r.rows.filter((x) => x.name === coll)
  return (
    <>
      <FilterBar><Pick value={coll} onChange={setColl} options={names.map((n) => [n, n === 'All' ? 'All collectors' : n])} /></FilterBar>
      <Section title={`Collector activity · ${from} to ${to}`}
        action={<ExportBtn onClick={() => exportSheet('activity.xlsx', [['Name', 'Collected', 'Receipts', 'Visits', 'Dealers visited'], ...rows.map((x) => [x.name, x.collected, x.receipts, x.visits, x.dealers_visited])], { money: [1], sheet: 'Activity' })} />}>
        {rows.length === 0 ? <Row2 a="No activity in range" b="" /> : rows.map((x) => (
          <div key={x.name} className="px-3.5 py-2.5 border-b border-slate-50 last:border-0">
            <div className="flex justify-between text-[13px]"><span className="font-semibold text-slate-800">{x.name}</span><span className="font-bold text-emerald-700">{inr(x.collected)}</span></div>
            <div className="text-[11px] text-slate-500 mt-0.5">{x.receipts} receipts · {x.visits} visits · {x.dealers_visited} dealers</div>
          </div>
        ))}
      </Section>
    </>
  )
}

function TopPerformers({ from, to }) {
  const [r, setR] = useState(null)
  useEffect(() => { setR(null); api.reportTopPerformers(from, to).then(setR) }, [from, to])
  if (!r) return <SkeletonList rows={5} />
  const Rank = ({ i, a, sub, amt }) => (
    <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-slate-50 last:border-0 text-[13px]">
      <span className="w-5 text-center font-display font-bold text-slate-300">{i + 1}</span>
      <div className="flex-1 min-w-0"><div className="font-semibold text-slate-800 truncate">{a}</div>{sub && <div className="text-[10px] text-slate-400">{sub}</div>}</div>
      <span className="font-bold text-slate-900 shrink-0">{inr(amt)}</span>
    </div>
  )
  return (
    <>
      <div className="text-[12px] text-slate-500 mb-3 px-0.5">Best performers · {from} → {to}</div>
      <Section title="Top SKUs" action={<ExportBtn onClick={() => exportSheet('top-skus.xlsx', [['Model', 'Brand', 'Qty', 'Amount'], ...r.top_skus.map((x) => [x.model, x.brand, x.qty, x.amount])], { money: [3], sheet: 'SKUs' })} />}>
        {r.top_skus.length === 0 ? <Row2 a="No sales in range" b="" /> : r.top_skus.map((x, i) => <Rank key={i} i={i} a={x.model} sub={`${x.brand} · ${x.qty} sold`} amt={x.amount} />)}
      </Section>
      <Section title="Top dealers" action={<ExportBtn onClick={() => exportSheet('top-dealers.xlsx', [['Dealer', 'Qty', 'Amount'], ...r.top_dealers.map((x) => [x.dealer, x.qty, x.amount])], { money: [2], sheet: 'Dealers' })} />}>
        {r.top_dealers.length === 0 ? <Row2 a="—" b="" /> : r.top_dealers.map((x, i) => <Rank key={i} i={i} a={x.dealer} sub={`${x.qty} units`} amt={x.amount} />)}
      </Section>
    </>
  )
}

function BrandScorecard({ from, to }) {
  const [r, setR] = useState(null)
  useEffect(() => { setR(null); api.reportBrandScorecard(from, to).then(setR) }, [from, to])
  if (!r) return <SkeletonList rows={4} />
  return (
    <>
      <div className="text-[12px] text-slate-500 mb-3 px-0.5">Per-brand snapshot · purchases &amp; sales {from} → {to} · stock value is current</div>
      {r.rows.length === 0 ? <Row2 a="No brand activity in range" b="" /> : (
        <div className="grid gap-3 lg:grid-cols-2">
          {r.rows.map((x, i) => {
            const pct = x.sale_amount ? Math.round(x.margin / x.sale_amount * 100) : 0
            return (
              <div key={i} className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-soft">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-display text-lg font-bold text-slate-900">{x.brand}</div>
                  <span className={'text-[11px] font-bold px-2 py-0.5 rounded-full ring-1 ' + (x.margin >= 0 ? 'text-brand-700 bg-brand-50 ring-brand-100' : 'text-red-600 bg-red-50 ring-red-100')}>{pct}% margin</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <Metric label="Purchased" value={inr(x.purchase_amount)} sub={x.purchase_qty + ' qty'} />
                  <Metric label="Sold" value={inr(x.sale_amount)} sub={x.sale_units + ' units'} />
                  <Metric label="Stock value" value={inr(x.stock_value)} sub={x.stock_units + ' in stock'} />
                  <Metric label="Margin" value={inr(x.margin)} sub={pct + '%'} tone={x.margin >= 0 ? 'text-brand-700' : 'text-red-600'} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

function Metric({ label, value, sub, tone = 'text-slate-900' }) {
  return <div className="bg-slate-50 rounded-xl p-2.5"><div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div><div className={'font-display text-base font-bold ' + tone}>{value}</div><div className="text-[10px] text-slate-400">{sub}</div></div>
}

function BrandPick({ value, onChange, brands }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[12px] font-semibold text-slate-500">Brand</span>
      <select data-testid="brand-filter" value={value} onChange={(e) => onChange(e.target.value)}
        className="border border-slate-200 rounded-lg px-3 py-2 bg-white text-[13px] font-semibold text-slate-700 outline-none focus:border-emerald-500">
        <option value="">All brands</option>
        {(brands || []).map((b) => <option key={b} value={b}>{b}</option>)}
      </select>
    </div>
  )
}

function ProfitReport({ from, to }) {
  const [r, setR] = useState(null)
  const [brand, setBrand] = useState('')
  const [brands, setBrands] = useState([])
  useEffect(() => { setR(null); api.reportProfit(from, to, brand).then((x) => { setR(x); if (x.brands) setBrands(x.brands) }) }, [from, to, brand])
  if (!r) return <SkeletonList rows={5} />
  const pct = r.total_sale ? Math.round(r.total_margin / r.total_sale * 100) : 0
  return (
    <>
      <BrandPick value={brand} onChange={setBrand} brands={brands} />
      <Big label={`Margin · ${brand || 'All brands'} · ${from} to ${to} · ${r.units} unit(s) · ${pct}%`} value={inr(r.total_margin)} />
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3"><div className="text-[10px] uppercase tracking-wide text-slate-400">Sale value</div><div className="font-display text-lg font-bold">{inr(r.total_sale)}</div></div>
        <div className="bg-white border border-slate-200 rounded-xl p-3"><div className="text-[10px] uppercase tracking-wide text-slate-400">Cost</div><div className="font-display text-lg font-bold">{inr(r.total_cost)}</div></div>
      </div>
      {r.by_month && r.by_month.length > 0 && (
        <Section title="Margin by month">
          {(() => { const mx = Math.max(1, ...r.by_month.map((m) => Math.abs(m.margin))); return r.by_month.map((m, i) => (
            <div key={i} className="px-3.5 py-2.5 border-b border-slate-50 last:border-0">
              <div className="flex justify-between text-[13px] mb-1"><span className="font-semibold text-slate-700">{m.month}</span><span className={'font-bold ' + (m.margin >= 0 ? 'text-brand-700' : 'text-red-600')}>{inr(m.margin)}</span></div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className={'h-full rounded-full ' + (m.margin >= 0 ? 'bg-brand-500' : 'bg-red-500')} style={{ width: Math.round(Math.abs(m.margin) / mx * 100) + '%' }} /></div>
              <div className="text-[10px] text-slate-400 mt-1">sale {inr(m.sale)} · cost {inr(m.cost)}</div>
            </div>
          )) })()}
        </Section>
      )}
      <Section title="Margin by model" action={<ExportBtn onClick={() => exportSheet('profit.xlsx', [['Model', 'Brand', 'Qty', 'Sale', 'Cost', 'Margin'], ...r.rows.map((x) => [x.model, x.brand, x.qty, x.sale, x.cost, x.margin])], { money: [3, 4, 5], sheet: 'Profit' })} />}>
        {r.rows.length === 0 ? <Row2 a="No sold units in range" b="" /> : r.rows.map((x, i) => (
          <div key={i} className="px-3.5 py-2.5 border-b border-slate-50 last:border-0">
            <div className="flex justify-between text-[13px]"><span className="font-semibold text-slate-800 truncate pr-2">{x.model}</span><span className={'font-bold shrink-0 ' + (x.margin >= 0 ? 'text-brand-700' : 'text-red-600')}>{inr(x.margin)}</span></div>
            <div className="text-[10px] text-slate-400 mt-0.5">{x.brand} · {x.qty} sold · sale {inr(x.sale)} · cost {inr(x.cost)}</div>
          </div>
        ))}
      </Section>
    </>
  )
}

function SalesReport({ from, to }) {
  const [r, setR] = useState(null)
  const [q, setQ] = useState('')
  const run = () => { setR(null); api.reportSales(from, to, q).then(setR) }
  useEffect(() => { setR(null); api.reportSales(from, to, q).then(setR) }, [from, to]) // eslint-disable-line
  if (!r) return <SkeletonList rows={5} />
  return (
    <>
      <Big label={`Sales · ${from} to ${to} · ${r.count} line(s) · ${r.units} IMEI`} value={inr(r.total)} />
      <FilterBar>
        <Search value={q} onChange={setQ} placeholder="Dealer, model or IMEI…" />
        <button onClick={run} className="text-[12px] font-semibold text-brand-700 bg-brand-50 rounded-full px-3 py-1.5">Search</button>
      </FilterBar>
      <Section title="Top models sold">
        {(!r.by_model || r.by_model.length === 0) ? <Row2 a="No sales in range" b="" /> : r.by_model.map((m, i) => (
          <div key={i} className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-slate-50 last:border-0 text-[13px]">
            <span className="w-5 text-center font-display font-bold text-slate-300">{i + 1}</span>
            <div className="flex-1 min-w-0"><div className="font-semibold text-slate-800 truncate">{m.model}</div><div className="text-[10px] text-slate-400">{m.brand} · {m.qty} sold</div></div>
            <span className="font-bold text-slate-900 shrink-0">{inr(m.amount)}</span>
          </div>
        ))}
      </Section>
      <Section title="By dealer" action={<ExportBtn onClick={() => exportSheet('sales.xlsx', [['Date', 'Bill', 'Dealer', 'Brand', 'Model', 'IMEI', 'Qty', 'Amount'], ...r.rows.map((x) => [x.date, x.bill_no, x.dealer, x.brand, x.model, x.imei, x.qty, x.amount])], { money: [7], sheet: 'Sales' })} />}>
        {r.by_dealer.length === 0 ? <Row2 a="No sales in range" b="" /> : r.by_dealer.map((d, i) => <Row2 key={i} a={`${d.dealer} · ${d.qty}`} b={inr(d.amount)} bold />)}
      </Section>
      <Section title="Lines · dealer × model × IMEI">
        {r.rows.length === 0 ? <Row2 a="—" b="" /> : r.rows.slice(0, 300).map((x, i) => (
          <div key={i} className="px-3.5 py-2.5 border-b border-slate-50 last:border-0">
            <div className="flex justify-between text-[13px]"><span className="font-semibold text-slate-800 truncate pr-2">{x.dealer}</span><span className="font-bold text-slate-900 shrink-0">{inr(x.amount)}</span></div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate">{x.model}{x.imei ? ` · ${x.imei}` : ''}</div>
            <div className="text-[10px] text-slate-400">Bill {x.bill_no} · {x.date}{x.brand ? ` · ${x.brand}` : ''}</div>
          </div>
        ))}
      </Section>
    </>
  )
}

function PurchaseBrandReport({ from, to }) {
  const [r, setR] = useState(null)
  const [brand, setBrand] = useState('')
  useEffect(() => { setR(null); api.reportPurchasesBrand(from, to, brand).then(setR) }, [from, to, brand])
  if (!r) return <SkeletonList rows={5} />
  return (
    <>
      <Big label={`Purchases · ${from} to ${to}${brand ? ' · ' + brand : ''}`} value={inr(r.total)} />
      <FilterBar>
        <select value={brand} onChange={(e) => setBrand(e.target.value)} className="border border-slate-200 rounded-lg px-2 py-2 text-[13px] bg-white">
          <option value="">All brands</option>
          {r.by_brand.map((b) => <option key={b.brand} value={b.brand}>{b.brand}</option>)}
        </select>
      </FilterBar>
      <Section title="By brand" action={<ExportBtn onClick={() => exportSheet('purchases-brand.xlsx', [['Brand', 'Qty', 'Amount'], ...r.by_brand.map((x) => [x.brand, x.qty, x.amount])], { money: [2], sheet: 'Brand' })} />}>
        {r.by_brand.length === 0 ? <Row2 a="No purchases in range" b="" /> : r.by_brand.map((b, i) => <Row2 key={i} a={`${b.brand} · ${b.qty}`} b={inr(b.amount)} bold />)}
      </Section>
      <Section title="By month">
        {r.by_month.length === 0 ? <Row2 a="—" b="" /> : r.by_month.map((m, i) => <Row2 key={i} a={m.month} b={inr(m.amount)} />)}
      </Section>
      <Section title="By category">
        {r.by_category.length === 0 ? <Row2 a="—" b="" /> : r.by_category.map((c, i) => <Row2 key={i} a={`${c.group} · ${c.qty}`} b={inr(c.amount)} />)}
      </Section>
    </>
  )
}

function PdfBills({ from, to }) {
  const [r, setR] = useState(null)
  const [q, setQ] = useState('')
  useEffect(() => { setR(null); setQ(''); api.reportBills(from, to, 'pdf').then(setR) }, [from, to])
  if (!r) return <SkeletonList rows={5} />
  const rows = (r.rows || []).filter((x) => !q || (x.dealer || '').toLowerCase().includes(q.toLowerCase()) || (x.bill_no || '').toLowerCase().includes(q.toLowerCase()))
  const total = rows.reduce((s, x) => s + x.amount, 0)
  return (
    <>
      <Big label={`Bills added from PDF · ${from} to ${to}`} value={inr(total)} />
      <FilterBar><Search value={q} onChange={setQ} placeholder="Search dealer or bill no…" /></FilterBar>
      <Section title={`${rows.length} bill${rows.length === 1 ? '' : 's'}`}
        action={<ExportBtn onClick={() => exportSheet('pdf-bills.xlsx', [['Date', 'Bill No', 'Dealer', 'Amount'], ...rows.map((x) => [x.date, x.bill_no, x.dealer, x.amount])], { money: [3], sheet: 'PDF bills' })} />}>
        {rows.length === 0 ? <Row2 a="No PDF-imported bills in this range" b="" /> : rows.map((x, i) => (
          <div key={i} className="px-3.5 py-2.5 border-b border-slate-50 last:border-0">
            <div className="flex justify-between text-[13px]"><span className="font-semibold text-slate-800 truncate pr-2">{x.dealer}</span><span className="font-bold text-slate-900 shrink-0">{inr(x.amount)}</span></div>
            <div className="text-[11px] text-slate-500 mt-0.5">Bill {x.bill_no} · {x.date}</div>
          </div>
        ))}
      </Section>
    </>
  )
}

function BillAgeing() {
  const { company } = useAuth()
  const shareDealer = async (d) => {
    const rows = d.bills.map((b) => [b.bill_no === 'Opening' ? 'Opening balance' : b.bill_no, b.date, b.amount, b.unpaid, b.days, BUCKET_LABEL[b.bucket] + ' days'])
    const blob = await renderTableImage({ company: company?.name, title: d.name, subtitle: 'Bill ageing · Outstanding ' + inr(d.shown),
      headers: [{ label: 'Bill No', w: 1.6 }, { label: 'Date', w: 1.2 }, { label: 'Amount', type: 'money', w: 1.3 }, { label: 'Unpaid', type: 'money', w: 1.3 }, { label: 'Age', type: 'num', w: 0.7 }, { label: 'Bucket', w: 1.2 }],
      rows })
    const res = await shareImage(blob, d.name + '-bill-ageing.png', d.name + ' — outstanding ' + inr(d.shown))
    if (res === 'downloaded') toast.info('Image saved — attach it in WhatsApp')
  }
  const [r, setR] = useState(null)
  const [q, setQ] = useState('')
  const [bucket, setBucket] = useState('All')
  useEffect(() => { api.reportBillAgeing().then(setR) }, [])
  if (!r) return <SkeletonList rows={5} />
  const dealers = (r.dealers || [])
    .map((d) => {
      const bills = d.bills.filter((b) => bucket === 'All' || b.bucket === bucket)
      return { ...d, bills, shown: bills.reduce((s, b) => s + b.unpaid, 0) }
    })
    .filter((d) => (!q || d.name.toLowerCase().includes(q.toLowerCase())) && d.bills.length > 0)
  const build = () => {
    const rows = [['Bill No', 'Bill Date', 'Bill Amount', 'Unpaid', 'Age (days)', 'Bucket']]
    const bold = []
    dealers.forEach((d) => {
      bold.push(rows.length)
      rows.push([d.name + '  —  Outstanding ' + d.shown])
      d.bills.forEach((b) => rows.push([b.bill_no === 'Opening' ? 'Opening balance' : b.bill_no, b.date, b.amount, b.unpaid, b.days, BUCKET_LABEL[b.bucket] + ' days']))
      rows.push([])
    })
    return { rows, bold }
  }
  return (
    <>
      <div className="flex justify-between items-center mb-2 px-0.5">
        <div className="text-xs font-bold text-slate-600">Bill-wise ageing</div>
        <ExportBtn onClick={() => { const { rows, bold } = build(); exportSheet('bill-ageing.xlsx', rows, { money: [2, 3], boldRows: bold, sheet: 'Bill ageing' }) }} />
      </div>
      <FilterBar><Search value={q} onChange={setQ} /><Pick value={bucket} onChange={setBucket} options={BUCKET_OPTS} /></FilterBar>
      {dealers.length === 0 ? (
        <div className="text-center text-slate-400 text-sm py-12 bg-white border border-dashed border-slate-200 rounded-xl">No bills match.</div>
      ) : dealers.map((d) => (
        <div key={d.name} className="bg-white border border-slate-200 rounded-xl mb-3 overflow-hidden">
          <div className="flex justify-between items-center px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 gap-2">
            <div className="text-[14px] font-bold text-slate-800 truncate">{d.name}</div>
            <div className="flex items-center gap-3 shrink-0">
              <button onClick={() => shareDealer(d)} className="text-[12px] font-semibold text-[#075E54]">Share</button>
              <div className="text-[14px] font-bold text-slate-900">{inr(d.shown)}</div>
            </div>
          </div>
          {d.bills.map((b, i) => (
            <div key={i} className="flex justify-between items-center px-3.5 py-2.5 border-b border-slate-50 last:border-0 text-[13px]">
              <div className="min-w-0 pr-2">
                <div className="font-semibold text-slate-800 truncate">{b.bill_no === 'Opening' ? 'Opening balance' : 'Bill ' + b.bill_no}</div>
                <div className="text-[11px] text-slate-500">{b.date} · {b.days} days · <span className={b.bucket === 'age_90p' ? 'text-red-600 font-semibold' : ''}>{BUCKET_LABEL[b.bucket]} days</span></div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-bold text-slate-900">{inr(b.unpaid)}</div>
                {b.unpaid !== b.amount && <div className="text-[10px] text-slate-400">of {inr(b.amount)} · {Math.round((1 - b.unpaid / b.amount) * 100)}% paid</div>}
              </div>
            </div>
          ))}
        </div>
      ))}
    </>
  )
}


function P2Slider({ label, val, set, min, max, step, unit, hint }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-baseline mb-1.5">
        <label className="text-[13px] font-medium text-slate-700">{label}</label>
        <span className="text-[13px] font-bold text-slate-900">{val}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => set(parseFloat(e.target.value))}
        className="w-full accent-emerald-600" />
      {hint && <div className="text-[11px] text-slate-400 mt-1">{hint}</div>}
    </div>
  )
}

function Profit2({ from, to }) {
  const [r, setR] = useState(null)
  const [brand, setBrand] = useState('HAIER')
  const [brands, setBrands] = useState([])
  const [scheme, setScheme] = useState(1.5)
  const [opex, setOpex] = useState(2)
  const [coc, setCoc] = useState(12)
  const [payDays, setPayDays] = useState(7)
  useEffect(() => {
    setR(null)
    api.reportProfit2(from, to, brand).then((x) => {
      setR(x)
      if (x.brands) { setBrands(x.brands); if (brand && !x.brands.includes(brand)) setBrand('') }
    })
  }, [from, to, brand])
  if (!r) return <SkeletonList rows={5} />

  const days = r.period_days || 30
  const monthK = 30.4 / days                       // period → 30-day equivalent
  const schemeP = r.revenue * scheme / 100
  const opexP = r.revenue * opex / 100
  const payables = r.ann_cogs * payDays / 365
  const wc = Math.max(0, r.stock_value + r.receivables - payables)
  const finP = wc * coc / 100 * days / 365
  const netP = r.gross + schemeP - opexP - finP
  const netM = netP * monthK
  const roce = wc > 0 ? (netP * 365 / days / wc * 100) : 0
  const turns = wc > 0 ? (r.ann_cogs / wc) : 0
  const ccc = r.stock_days + r.recv_days - payDays
  const nmPct = r.revenue > 0 ? netP / r.revenue * 100 : 0
  const label = brand || 'All brands'

  const exportMargin = () => exportSheet('gross-margin-' + (brand || 'all').toLowerCase() + '.xlsx', [
    ['Model', 'Brand', 'Qty', 'Sale', 'Cost', 'Gross margin', 'Margin %'],
    ...r.rows.map((x) => [x.model, x.brand, x.qty, x.sale, x.cost, x.margin, x.margin_pct]),
    ['Total', label, r.units, r.revenue, r.cogs, r.gross, r.gross_margin_pct],
  ], { money: [3, 4, 5], boldRows: [r.rows.length + 1], sheet: 'Gross margin' })

  const exportPnl = () => exportSheet('profit2-' + (brand || 'all').toLowerCase() + '.xlsx', [
    ['Item', 'Value'],
    ['Brand', label], ['Period', from + ' to ' + to], ['Units sold', r.units],
    ['Revenue', r.revenue], ['Cost of goods', r.cogs], ['Gross margin', r.gross], ['Gross margin %', r.gross_margin_pct],
    ['Stock value on hand', r.stock_value], ['Receivables' + (r.receivables_estimated ? ' (est. share)' : ''), r.receivables],
    ['Stock days', r.stock_days], ['Dealer credit days', r.recv_days],
    ['Scheme income %', scheme], ['Operating cost %', opex], ['Cost of capital %', coc], ['Supplier credit days', payDays],
    ['Period days', days],
    ['Gross margin (period)', r.gross], ['Scheme income (period) = revenue × scheme %', Math.round(schemeP)],
    ['Operating cost (period) = revenue × opex %', -Math.round(opexP)], ['Financing cost (period) = working capital × CoC % × days/365', -Math.round(finP)],
    ['Net profit (period)', Math.round(netP)], ['Net profit / month (×30.4/days)', Math.round(netM)], ['Net margin %', +nmPct.toFixed(1)],
    ['Working capital tied up', Math.round(wc)], ['Cash conversion cycle (days)', Math.round(ccc)], ['Annual return on capital %', Math.round(roce)],
  ], { sheet: 'Profit 2' })

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <BrandPick value={brand} onChange={setBrand} brands={brands} />
        <div className="flex gap-2 mb-3">
          <ExportBtn onClick={exportMargin} />
          <button data-testid="p2-export-pnl" onClick={exportPnl} className="text-[12px] font-semibold text-slate-700 bg-slate-100 rounded-full px-3 py-1.5 flex items-center gap-1"><Download size={13} />P&amp;L</button>
        </div>
      </div>
      {r.duplicates_ignored > 0 && (
        <div data-testid="p2-dup-note" className="rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[12px] px-3 py-2 mb-3">
          {r.duplicates_ignored} re-imported sale line(s) were ignored so revenue isn't double counted.
        </div>
      )}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 mb-4 flex flex-wrap items-end gap-6">
        <div className="flex-1 min-w-[160px]">
          <div data-testid="p2-roce" className={'text-5xl font-extrabold tracking-tight ' + (netM < 0 ? 'text-red-600' : 'text-emerald-700')}>{wc > 0 ? Math.round(roce) + '%' : '—'}</div>
          <div className="text-[12px] text-slate-500 mt-2 max-w-[240px]">Annual return on the capital tied up in {label}.</div>
        </div>
        <div className="flex gap-6">
          <div><div data-testid="p2-net-period" className="text-xl font-bold">{inr(Math.round(netP))}</div><div className="text-[11px] text-slate-400 mt-0.5">Net profit · {days} days</div><div className="text-[11px] text-slate-400">≈ {inr(Math.round(netM))} / month</div></div>
          <div><div className="text-xl font-bold">{turns > 0 ? turns.toFixed(1) + '×' : '—'}</div><div className="text-[11px] text-slate-400 mt-0.5">Capital turns / year</div></div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <Metric label="Revenue" value={inr(r.revenue)} sub={r.units + ' units'} />
        <Metric label="Cost of goods" value={inr(r.cogs)} sub="from purchases" />
        <Metric label="Gross margin" value={inr(r.gross)} sub={r.gross_margin_pct + '%'} tone={r.gross >= 0 ? 'text-emerald-700' : 'text-red-600'} />
        <Metric label="Stock on hand" value={inr(r.stock_value)} sub={r.stock_days + ' days'} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
          <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-3">{label} · real data · {from} to {to}</div>
          <Row2 a="Revenue (sales)" b={inr(r.revenue)} />
          <Row2 a="Cost of goods (from purchases)" b={inr(r.cogs)} />
          <Row2 a={'Gross margin · ' + r.gross_margin_pct + '%'} b={inr(r.gross)} bold />
          <Row2 a="Units sold" b={r.units} />
          <div className="h-2" />
          <Row2 a="Stock value on hand" b={inr(r.stock_value)} />
          <Row2 a={'Receivables (dealer credit)' + (r.receivables_estimated ? ' · est. share' : '')} b={inr(r.receivables)} />
          <Row2 a="Stock days" b={r.stock_days + ' d'} />
          <Row2 a="Dealer credit days" b={r.recv_days + ' d'} />
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
          <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-3">Your assumptions (not in data)</div>
          <P2Slider label="Scheme / incentive income" val={scheme} set={setScheme} min={0} max={12} step={0.25} unit="%" hint="Extra % from the brand for targets, displays." />
          <P2Slider label="Operating cost" val={opex} set={setOpex} min={0} max={6} step={0.25} unit="%" hint="Godown, staff, delivery, damage as % of sales." />
          <P2Slider label="Cost of capital" val={coc} set={setCoc} min={6} max={24} step={0.5} unit="%" hint="Interest on the money you keep locked up." />
          <P2Slider label={(brand || 'Supplier') + ' credit days'} val={payDays} set={setPayDays} min={0} max={45} step={1} unit=" d" hint="How long you get to pay the brand." />
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 mt-4">
        <div className="flex justify-between items-baseline mb-3">
          <div className="text-[15px] font-bold text-slate-800">P&amp;L · {from} to {to} ({days} days)</div>
          <div className="text-[11px] text-slate-400">actual period figures</div>
        </div>
        <Row2 a="Gross margin (revenue − cost of goods)" b={'+' + inr(r.gross)} />
        <Row2 a={'Scheme income (' + inr(r.revenue) + ' × ' + scheme + '%)'} b={'+' + inr(Math.round(schemeP))} />
        <Row2 a={'Operating cost (' + inr(r.revenue) + ' × ' + opex + '%)'} b={'−' + inr(Math.round(opexP))} />
        <Row2 a={'Financing cost (' + inr(Math.round(wc)) + ' × ' + coc + '% × ' + days + '/365 days)'} b={'−' + inr(Math.round(finP))} />
        <div className="flex justify-between items-baseline pt-3 mt-1 border-t-2 border-slate-800">
          <span className="font-bold text-slate-900">Net profit · {days} days</span>
          <span data-testid="p2-net" className={'text-lg font-extrabold ' + (netP >= 0 ? 'text-emerald-700' : 'text-red-600')}>{inr(Math.round(netP))}</span>
        </div>
        <Row2 a={'Net profit / month (× 30.4 ÷ ' + days + ' days)'} b={inr(Math.round(netM))} />
        <Row2 a="Net margin on sales" b={nmPct.toFixed(1) + '%'} />
        <Row2 a="Working capital tied up (stock + receivables − supplier credit)" b={inr(Math.round(wc))} />
        <Row2 a="Cash conversion cycle" b={Math.round(ccc) + ' days'} />
      </div>

      {r.by_month && r.by_month.length > 1 && (
        <div className="mt-4">
          <Section title="Gross margin by month">
            {(() => { const mx = Math.max(1, ...r.by_month.map((m) => Math.abs(m.margin))); return r.by_month.map((m, i) => (
              <div key={i} className="px-3.5 py-2.5 border-b border-slate-50 last:border-0">
                <div className="flex justify-between text-[13px] mb-1"><span className="font-semibold text-slate-700">{m.month}</span><span className={'font-bold ' + (m.margin >= 0 ? 'text-brand-700' : 'text-red-600')}>{inr(m.margin)}</span></div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className={'h-full rounded-full ' + (m.margin >= 0 ? 'bg-brand-500' : 'bg-red-500')} style={{ width: Math.round(Math.abs(m.margin) / mx * 100) + '%' }} /></div>
                <div className="text-[10px] text-slate-400 mt-1">sale {inr(m.sale)} · cost {inr(m.cost)}</div>
              </div>
            )) })()}
          </Section>
        </div>
      )}

      <div className="mt-4">
        <Section title={'Gross margin by model · ' + r.rows.length + ' models'} action={<ExportBtn onClick={exportMargin} />}>
          {r.rows.length === 0 ? <Row2 a="No sales in range" b="" /> : r.rows.map((x, i) => (
            <div key={i} data-testid="p2-model-row" className="px-3.5 py-2.5 border-b border-slate-50 last:border-0">
              <div className="flex justify-between text-[13px]"><span className="font-semibold text-slate-800 truncate pr-2">{x.model}</span><span className={'font-bold shrink-0 ' + (x.margin >= 0 ? 'text-brand-700' : 'text-red-600')}>{inr(x.margin)} <span className="text-[10px] font-semibold text-slate-400">{x.margin_pct}%</span></span></div>
              <div className="text-[10px] text-slate-400 mt-0.5">{x.brand} · {x.qty} sold · sale {inr(x.sale)} · cost {inr(x.cost)}</div>
            </div>
          ))}
        </Section>
      </div>

      <div className={'rounded-2xl p-4 mt-4 text-[13px] leading-relaxed border ' + (netM < 0 ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-100 text-emerald-900')}>
        <div className="text-[11px] font-bold uppercase tracking-wide mb-1.5">What this says</div>
        {netM < 0
          ? <>After financing your locked-up capital, you're losing <b>{inr(Math.round(-netP))}</b> over these {days} days (≈ {inr(Math.round(-netM))}/month) on {label} at these assumptions. Gross margin of <b>{r.gross_margin_pct}%</b> plus schemes isn't covering opex and interest. Push margin/scheme up or shrink the {Math.round(ccc)}-day cash cycle.</>
          : <>Your cash stays locked for <b>{Math.round(ccc)} days</b> each cycle. Gross margin is <b>{r.gross_margin_pct}%</b>; after schemes, opex and financing you net <b>{inr(Math.round(netP))}</b> over these {days} days (≈ {inr(Math.round(netM))}/month) — a <b>{Math.round(roce)}%</b> annual return on the <b>{inr(Math.round(wc))}</b> you keep tied up.</>}
      </div>
      <div className="text-[11px] text-slate-400 mt-3">Revenue, cost and stock are your imported {label} sales &amp; purchases in this date range. {r.receivables_estimated ? 'Receivables are an estimated share of total dealer outstanding, split by this brand\u2019s revenue.' : 'Receivables are your total dealer outstanding.'} Scheme, opex, cost-of-capital and credit days are your inputs above. Monthly figures are the period figures scaled by 30.4 ÷ {days} days; annual return = net profit × 365 ÷ {days} ÷ working capital.</div>
    </>
  )
}
