import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { api } from '../../api/client.js'
import { inr } from '../../lib/format.js'
import { exportSheet } from '../../lib/excel.js'
import { Spin, BackBtn, Card } from '../../components/ui.jsx'

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
        {[['collections', 'Collections'], ['ageing', 'Ageing'], ['billage', 'Bill ageing'], ['activity', 'Activity'], ['svc', 'Sales vs Coll']].map(([k, l]) => (
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

function Collections({ from, to }) {
  const [r, setR] = useState(null)
  useEffect(() => { setR(null); api.reportCollections(from, to).then(setR) }, [from, to])
  if (!r) return <Spin />
  return (
    <>
      <Big label={`Total collected · ${from} to ${to}`} value={inr(r.total)} />
      <Section title="By mode" action={<ExportBtn onClick={() => exportSheet('collections-by-mode.xlsx', [['Mode', 'Amount'], ...Object.entries(r.by_mode).map(([m, v]) => [m, v]), ['Total', r.total]], { money: [1], sheet: 'Collections by mode' })} />}>
        {Object.keys(r.by_mode).length === 0 ? <Row2 a="No collections in range" b="" /> : Object.entries(r.by_mode).map(([m, v]) => <Row2 key={m} a={m} b={inr(v)} />)}
      </Section>
      <Section title="By collector" action={<ExportBtn onClick={() => exportSheet('collections-by-collector.xlsx', [['Collector', 'Receipts', 'Amount'], ...r.by_collector.map((c) => [c.name, c.count, c.amount])], { money: [2], sheet: 'By collector' })} />}>
        {r.by_collector.length === 0 ? <Row2 a="No collections in range" b="" /> : r.by_collector.map((c) => <Row2 key={c.name} a={`${c.name} · ${c.count}`} b={inr(c.amount)} />)}
      </Section>
      <Section title="All entries" action={<ExportBtn onClick={() => exportSheet('collections.xlsx', [['Date', 'Dealer', 'Mode', 'Collector', 'Amount'], ...(r.rows || []).map((x) => [x.date, x.dealer, x.mode, x.collector, x.amount])], { money: [4], sheet: 'Collections' })} />}>
        {(r.rows || []).length === 0 ? <Row2 a="No collections in range" b="" /> : r.rows.map((x, i) => (
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
  useEffect(() => { api.reportAgeing().then(setR) }, [])
  if (!r) return <Spin />
  const AG = [['age_0_30', '0–30 days'], ['age_31_60', '31–60 days'], ['age_61_90', '61–90 days'], ['age_90p', '90+ days']]
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
      <Section title="Dealer-wise ageing" action={<ExportBtn onClick={() => exportSheet('dealer-ageing.xlsx', [['Dealer', '0-30', '31-60', '61-90', '90+', 'Outstanding'], ...(r.dealers || []).map((d) => [d.name, d.age_0_30, d.age_31_60, d.age_61_90, d.age_90p, d.outstanding])], { money: [1, 2, 3, 4, 5], sheet: 'Dealer ageing' })} />}>
        {(r.dealers || []).length === 0 ? <Row2 a="Nothing outstanding" b="" /> : r.dealers.map((d) => (
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
  useEffect(() => { setR(null); api.reportSalesVsColl(from, to).then(setR) }, [from, to])
  if (!r) return <Spin />
  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <Card n={inr(r.total_sales)} l="Total billed (sales)" />
        <Card n={inr(r.total_collected)} l="Total collected" />
      </div>
      <Section title={`Per dealer · ${from} to ${to}`}
        action={<ExportBtn onClick={() => exportSheet('sales-vs-collection.xlsx', [['Dealer', 'Sales', 'Collected', 'Net (sales-coll)'], ...r.rows.map((x) => [x.name, x.sales, x.collected, x.net])], { money: [1, 2, 3], sheet: 'Sales vs Collection' })} />}>
        {r.rows.length === 0 ? <Row2 a="No activity in range" b="" /> : r.rows.map((x) => (
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
  useEffect(() => { setR(null); api.reportActivity(from, to).then(setR) }, [from, to])
  if (!r) return <Spin />
  return (
    <Section title={`Collector activity · ${from} to ${to}`}
      action={<ExportBtn onClick={() => exportSheet('activity.xlsx', [['Name', 'Collected', 'Receipts', 'Visits', 'Dealers visited'], ...r.rows.map((x) => [x.name, x.collected, x.receipts, x.visits, x.dealers_visited])], { money: [1], sheet: 'Activity' })} />}>
      {r.rows.length === 0 ? <Row2 a="No activity in range" b="" /> : r.rows.map((x) => (
        <div key={x.name} className="px-3.5 py-2.5 border-b border-slate-50 last:border-0">
          <div className="flex justify-between text-[13px]"><span className="font-semibold text-slate-800">{x.name}</span><span className="font-bold text-emerald-700">{inr(x.collected)}</span></div>
          <div className="text-[11px] text-slate-500 mt-0.5">{x.receipts} receipts · {x.visits} visits · {x.dealers_visited} dealers</div>
        </div>
      ))}
    </Section>
  )
}


const BUCKET_LABEL = { age_0_30: '0–30', age_31_60: '31–60', age_61_90: '61–90', age_90p: '90+' }
function BillAgeing() {
  const [r, setR] = useState(null)
  useEffect(() => { api.reportBillAgeing().then(setR) }, [])
  if (!r) return <Spin />
  const flat = () => {
    const rows = [['Dealer', 'Bill No', 'Bill Date', 'Bill Amount', 'Unpaid', 'Age (days)', 'Bucket']]
    r.dealers.forEach((d) => d.bills.forEach((b) => rows.push([d.name, b.bill_no, b.date, b.amount, b.unpaid, b.days, BUCKET_LABEL[b.bucket] + ' days'])))
    return rows
  }
  return (
    <>
      <div className="flex justify-between items-center mb-2 px-0.5">
        <div className="text-xs font-bold text-slate-600">Bill-wise ageing</div>
        <ExportBtn onClick={() => exportSheet('bill-ageing.xlsx', flat(), { money: [3, 4], sheet: 'Bill ageing' })} />
      </div>
      {r.dealers.length === 0 ? (
        <div className="text-center text-slate-400 text-sm py-12 bg-white border border-dashed border-slate-200 rounded-xl">Nothing outstanding.</div>
      ) : r.dealers.map((d) => (
        <div key={d.name} className="bg-white border border-slate-200 rounded-xl mb-3 overflow-hidden">
          <div className="flex justify-between items-center px-3.5 py-2.5 bg-slate-50 border-b border-slate-200">
            <div className="text-[14px] font-bold text-slate-800 truncate pr-2">{d.name}</div>
            <div className="text-[14px] font-bold text-slate-900 shrink-0">{inr(d.outstanding)}</div>
          </div>
          {d.bills.map((b, i) => (
            <div key={i} className="flex justify-between items-center px-3.5 py-2.5 border-b border-slate-50 last:border-0 text-[13px]">
              <div className="min-w-0 pr-2">
                <div className="font-semibold text-slate-800 truncate">{b.bill_no === 'Opening' ? 'Opening balance' : 'Bill ' + b.bill_no}</div>
                <div className="text-[11px] text-slate-500">{b.date} · {b.days} days · <span className={b.bucket === 'age_90p' ? 'text-red-600 font-semibold' : ''}>{BUCKET_LABEL[b.bucket]} days</span></div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-bold text-slate-900">{inr(b.unpaid)}</div>
                {b.unpaid !== b.amount && <div className="text-[10px] text-slate-400">of {inr(b.amount)}</div>}
              </div>
            </div>
          ))}
        </div>
      ))}
    </>
  )
}