import { useEffect, useState } from 'react'
import { api } from '../../api/client.js'
import { inr } from '../../lib/format.js'
import { exportSheet } from '../../lib/excel.js'
import { waLink } from '../../lib/whatsapp.js'
import { toast } from '../../lib/toast.js'
import { SkeletonList } from '../../components/ui.jsx'
import { Big, ExportBtn, Section, Row2, Metric, SelPick, Tag, Bar, Delta } from '../../components/reportBits.jsx'

const TAG = {
  star: ['green', 'Profitable & pays fast'], big_slow: ['red', 'Big volume · slow payer'], slow: ['amber', 'Slow payer'],
  fast: ['blue', 'Pays fast'], ok: ['slate', 'Average'], inactive: ['slate', 'Inactive'],
}

// 4. Dealer scorecard 2.0
export function DealerScorecard({ from, to }) {
  const [r, setR] = useState(null)
  const [tag, setTag] = useState('')
  useEffect(() => { setR(null); api.reportDealerScorecard(from, to).then(setR) }, [from, to])
  if (!r) return <SkeletonList rows={5} />
  const rows = tag ? r.rows.filter((x) => x.tag === tag) : r.rows
  const t = r.totals || {}
  const dl = () => exportSheet('dealer-scorecard.xlsx',
    [['Dealer', 'Area', 'Type', 'Sales', 'Collections', 'Outstanding', 'Avg pay delay (d)', 'Oldest unpaid (d)', 'Units', 'Margin', 'Margin %', 'Financing cost', 'True margin'],
     ...rows.map((x) => [x.name, x.area, TAG[x.tag][1], x.sales, x.collections, x.outstanding, x.avg_delay ?? '', x.oldest_unpaid, x.units, x.margin, x.margin_pct, x.fin_cost, x.true_margin])],
    { money: [3, 4, 5, 9, 11, 12], sheet: 'Scorecard' })
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        <Metric label="Dealers" value={t.dealers || 0} sub={(t.stars || 0) + ' stars · ' + (t.big_slow || 0) + ' big & slow'} />
        <Metric label="Sales" value={inr(t.sales || 0)} sub={from + ' → ' + to} />
        <Metric label="Margin earned" value={inr(t.margin || 0)} sub={'median ' + r.median_margin_pct + '%'} tone="text-emerald-700" />
        <Metric label="Outstanding" value={inr(t.outstanding || 0)} sub={'collected ' + inr(t.collections || 0)} />
      </div>
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        {[['', 'All'], ['star', 'Stars'], ['big_slow', 'Big & slow'], ['slow', 'Slow'], ['fast', 'Fast payers']].map(([k, l]) => (
          <button key={k} data-testid={'dsc-tag-' + (k || 'all')} onClick={() => setTag(k)} className={'text-[12px] font-semibold px-3 py-1.5 rounded-full border ' + (tag === k ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500')}>{l}</button>
        ))}
        <div className="ml-auto"><ExportBtn onClick={dl} /></div>
      </div>
      <Section title={rows.length + ' dealers · ranked by true margin (margin − interest on outstanding)'}>
        {rows.length === 0 ? <Row2 a="No dealers" b="" /> : rows.map((x) => {
          const [tone, label] = TAG[x.tag]
          return (
            <div key={x.id} data-testid="dsc-row" className="px-3.5 py-3 border-b border-slate-50 last:border-0">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0"><div className="text-[14px] font-semibold text-slate-800 truncate">{x.name}</div><div className="mt-1"><Tag tone={tone}>{label}</Tag></div></div>
                <div className="text-right shrink-0"><div className={'text-[15px] font-bold ' + (x.true_margin >= 0 ? 'text-emerald-700' : 'text-red-600')}>{inr(x.true_margin)}</div><div className="text-[10px] text-slate-400">true margin</div></div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-2 text-[11px]">
                <div><div className="text-slate-400">Sales</div><div className="font-semibold">{inr(x.sales)}</div></div>
                <div><div className="text-slate-400">Collected</div><div className="font-semibold">{inr(x.collections)}</div></div>
                <div><div className="text-slate-400">Outstanding</div><div className={'font-semibold ' + (x.age_90p > 0 ? 'text-red-600' : '')}>{inr(x.outstanding)}</div></div>
                <div><div className="text-slate-400">Margin</div><div className="font-semibold">{inr(x.margin)} · {x.margin_pct}%</div></div>
                <div><div className="text-slate-400">Pays in</div><div className={'font-semibold ' + ((x.avg_delay ?? x.oldest_unpaid) > 45 ? 'text-red-600' : '')}>{x.avg_delay != null ? x.avg_delay + ' d' : '—'}</div></div>
                <div><div className="text-slate-400">Oldest unpaid</div><div className="font-semibold">{x.oldest_unpaid} d</div></div>
              </div>
            </div>
          )
        })}
      </Section>
    </>
  )
}

// 5. Credit-days trend
export function CreditTrend() {
  const [r, setR] = useState(null)
  const [months, setMonths] = useState(6)
  useEffect(() => { setR(null); api.reportCreditTrend(months).then(setR) }, [months])
  if (!r) return <SkeletonList rows={5} />
  const dl = () => exportSheet('credit-trend.xlsx',
    [['Dealer', 'Flag', 'Change (d)', 'Latest (d)', 'Outstanding', ...r.months], ...r.rows.map((x) => [x.name, x.flag, x.change, x.latest, x.outstanding, ...x.series.map((s) => s.delay ?? '')])],
    { money: [4], sheet: 'Credit trend' })
  const FL = { warning: ['red', 'Slowing down'], steady: ['slate', 'Steady'], improving: ['green', 'Improving'] }
  const mx = Math.max(30, ...r.rows.flatMap((x) => x.series.map((s) => s.delay || 0)))
  return (
    <>
      <Big label={`Dealers paying slower than before · last ${months} months`} value={r.warnings} tone={r.warnings > 0 ? 'text-red-600' : 'text-emerald-700'} />
      <div className="flex items-center gap-2 mb-3">
        {[3, 6, 12].map((m) => <button key={m} onClick={() => setMonths(m)} className={'text-[12px] font-semibold px-3 py-1.5 rounded-full border ' + (months === m ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500')}>{m} mo</button>)}
        <div className="ml-auto"><ExportBtn onClick={dl} /></div>
      </div>
      <Section title="Average days to pay, by bill month (weighted by bill amount)">
        {r.rows.length === 0 ? <Row2 a="Need at least 2 months of bills per dealer" b="" /> : r.rows.map((x) => {
          const [tone, label] = FL[x.flag]
          return (
            <div key={x.id} data-testid="trend-row" className="px-3.5 py-3 border-b border-slate-50 last:border-0">
              <div className="flex justify-between items-center gap-2">
                <div className="min-w-0"><span className="text-[14px] font-semibold text-slate-800 truncate">{x.name}</span> <Tag tone={tone}>{label}</Tag></div>
                <div className="text-right shrink-0 text-[11px] text-slate-500">{x.change >= 0 ? '+' : ''}{x.change} d · owes {inr(x.outstanding)}</div>
              </div>
              <div className="flex items-end gap-1 mt-2 h-10">
                {x.series.map((s) => (
                  <div key={s.month} className="flex-1 flex flex-col items-center justify-end h-full" title={s.month + ': ' + (s.delay ?? '—') + ' d'}>
                    <div className={'w-full rounded-t ' + (s.delay == null ? 'bg-slate-100' : s.delay > 45 ? 'bg-red-400' : s.delay > 30 ? 'bg-amber-400' : 'bg-emerald-500')} style={{ height: s.delay == null ? '4px' : Math.max(6, s.delay / mx * 36) + 'px' }} />
                  </div>
                ))}
              </div>
              <div className="flex gap-1 text-[9px] text-slate-400">{x.series.map((s) => <div key={s.month} className="flex-1 text-center">{s.month.slice(5)}{s.delay != null ? ' · ' + s.delay : ''}</div>)}</div>
            </div>
          )
        })}
      </Section>
    </>
  )
}

// 6. Inactive dealers
export function InactiveDealers() {
  const [r, setR] = useState(null)
  const [days, setDays] = useState(30)
  useEffect(() => { setR(null); api.reportInactive(days).then(setR) }, [days])
  if (!r) return <SkeletonList rows={5} />
  const dl = () => exportSheet('inactive-dealers.xlsx',
    [['Dealer', 'Area', 'Phone', 'Last bill', 'Days since', 'Bills', 'Avg gap (d)', 'Monthly run-rate', 'Est. lost revenue', 'Lifetime sales', 'Outstanding', 'Was regular'],
     ...r.rows.map((x) => [x.name, x.area, x.phone, x.last_bill, x.days_since, x.bills, x.avg_gap ?? '', x.monthly_run_rate, x.lost_revenue, x.lifetime, x.outstanding, x.regular ? 'Yes' : ''])],
    { money: [7, 8, 9, 10], sheet: 'Inactive' })
  return (
    <>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <Metric label="Inactive" value={r.count} sub={'no bill in ' + days + '+ days'} />
        <Metric label="Were regular" value={r.regular_lost} sub="bought every ≤45 d" tone="text-red-600" />
        <Metric label="Est. revenue lost" value={inr(r.lost_revenue)} sub="run-rate × gap" tone="text-red-600" />
      </div>
      <div className="flex items-center gap-2 mb-3">
        {[30, 60, 90].map((d) => <button key={d} data-testid={'inactive-' + d} onClick={() => setDays(d)} className={'text-[12px] font-semibold px-3 py-1.5 rounded-full border ' + (days === d ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500')}>{d}+ days</button>)}
        <div className="ml-auto"><ExportBtn onClick={dl} /></div>
      </div>
      <Section title="Regular buyers first · tap phone to WhatsApp">
        {r.rows.length === 0 ? <Row2 a="Everyone has bought recently" b="" /> : r.rows.map((x) => (
          <div key={x.id} data-testid="inactive-row" className="px-3.5 py-3 border-b border-slate-50 last:border-0">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-slate-800 truncate">{x.name} {x.regular && <Tag tone="red">was regular</Tag>}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Last bill {x.last_bill} · <b className="text-slate-700">{x.days_since} days ago</b>{x.avg_gap ? ` · used to buy every ${x.avg_gap} d` : ''}</div>
              </div>
              <div className="text-right shrink-0"><div className="text-[14px] font-bold text-slate-800">{inr(x.monthly_run_rate)}<span className="text-[10px] text-slate-400">/mo</span></div>{x.outstanding > 0 && <div className="text-[10px] text-red-600">owes {inr(x.outstanding)}</div>}</div>
            </div>
            {x.phone && <a href={waLink(x.phone, `Namaste ${x.name}, this is Ashoka Distribution. We haven't received an order from you since ${x.last_bill}. Any new requirement? We have fresh stock and schemes running.`)} target="_blank" rel="noreferrer" className="inline-block mt-1.5 text-[11px] font-semibold text-emerald-700">WhatsApp {x.phone} →</a>}
          </div>
        ))}
      </Section>
    </>
  )
}

// 7. Month-on-month
export function MonthOnMonth() {
  const [r, setR] = useState(null)
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [by, setBy] = useState('brand')
  useEffect(() => { setR(null); api.reportMoM(month, by).then(setR) }, [month, by])
  if (!r) return <SkeletonList rows={5} />
  const t = r.totals
  const P = r.periods
  const dl = () => exportSheet('month-on-month-' + by + '.xlsx',
    [[by, P.cur, P.prev, 'MoM %', P.ly, 'YoY %', P.cur + ' units', P.prev + ' units', P.cur + ' margin', P.prev + ' margin'],
     ...r.rows.map((x) => [x.name, x.cur, x.prev, x.mom_pct ?? '', x.ly, x.yoy_pct ?? '', x.cur_units, x.prev_units, x.cur_margin, x.prev_margin]),
     ['Total', t.cur.sale, t.prev.sale, t.mom_pct ?? '', t.ly.sale, t.yoy_pct ?? '', t.cur.units, t.prev.units, t.cur.margin, t.prev.margin]],
    { money: [1, 2, 4, 8, 9], boldRows: [r.rows.length + 1], sheet: 'MoM' })
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input data-testid="mom-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="border border-slate-200 rounded-lg px-2 py-1.5 text-[13px]" />
        {[['brand', 'Brand'], ['group', 'Category'], ['dealer', 'Dealer'], ['model', 'Model']].map(([k, l]) => <button key={k} data-testid={'mom-by-' + k} onClick={() => setBy(k)} className={'text-[12px] font-semibold px-3 py-1.5 rounded-full border ' + (by === k ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500')}>{l}</button>)}
        <div className="ml-auto"><ExportBtn onClick={dl} /></div>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <Metric label={P.cur} value={inr(t.cur.sale)} sub={t.cur.units + ' units · margin ' + inr(t.cur.margin)} tone="text-emerald-700" />
        <Metric label={P.prev + ' (last month)'} value={inr(t.prev.sale)} sub={<Delta v={t.mom_pct} />} />
        <Metric label={P.ly + ' (last year)'} value={inr(t.ly.sale)} sub={<Delta v={t.yoy_pct} />} />
      </div>
      <Section title={'By ' + by}>
        {r.rows.length === 0 ? <Row2 a="No sales in these months" b="" /> : r.rows.map((x, i) => (
          <div key={i} data-testid="mom-row" className="px-3.5 py-2.5 border-b border-slate-50 last:border-0">
            <div className="flex justify-between items-baseline gap-2"><span className="text-[13px] font-semibold text-slate-800 truncate">{x.name}</span><span className="text-[14px] font-bold shrink-0">{inr(x.cur)}</span></div>
            <div className="flex justify-between text-[11px] text-slate-500 mt-0.5"><span>last month {inr(x.prev)} <Delta v={x.mom_pct} /></span><span>last year {inr(x.ly)} <Delta v={x.yoy_pct} /></span></div>
            <div className="text-[10px] text-slate-400">{x.cur_units} units (was {x.prev_units}) · margin {inr(x.cur_margin)} (was {inr(x.prev_margin)})</div>
          </div>
        ))}
      </Section>
    </>
  )
}

// 8. Category mix
export function CategoryMix({ from, to }) {
  const [r, setR] = useState(null)
  const [brand, setBrand] = useState('')
  useEffect(() => { setR(null); api.reportCategoryMix(from, to, brand).then(setR) }, [from, to, brand])
  if (!r) return <SkeletonList rows={5} />
  const dl = () => exportSheet('category-mix.xlsx',
    [['Category', 'Units', 'Models', 'Revenue', 'Revenue share %', 'Cost', 'Margin', 'Margin share %', 'Margin %', 'Margin / unit'],
     ...r.rows.map((x) => [x.group, x.units, x.models, x.sale, x.rev_share, x.cost, x.margin, x.margin_share, x.margin_pct, x.per_unit_margin]),
     ['Total', '', '', r.total_sale, 100, '', r.total_margin, 100, r.margin_pct, '']],
    { money: [3, 5, 6, 9], boldRows: [r.rows.length + 1], sheet: 'Category mix' })
  const colors = ['bg-emerald-500', 'bg-sky-500', 'bg-amber-400', 'bg-violet-500', 'bg-rose-400', 'bg-teal-400', 'bg-orange-400', 'bg-slate-400']
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <SelPick testid="cat-brand" label="All brands" value={brand} onChange={setBrand} options={r.brands || []} />
        <ExportBtn onClick={dl} />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Metric label="Revenue" value={inr(r.total_sale)} sub={from + ' → ' + to} />
        <Metric label="Gross margin" value={inr(r.total_margin)} sub={r.margin_pct + '%'} tone="text-emerald-700" />
      </div>
      {r.rows.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 mb-3">
          <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-1.5">Revenue share</div>
          <div className="flex h-3 rounded-full overflow-hidden mb-3">{r.rows.map((x, i) => <div key={i} className={colors[i % colors.length]} style={{ width: x.rev_share + '%' }} title={x.group} />)}</div>
          <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-1.5">Margin share</div>
          <div className="flex h-3 rounded-full overflow-hidden">{r.rows.map((x, i) => <div key={i} className={colors[i % colors.length]} style={{ width: Math.max(0, x.margin_share) + '%' }} title={x.group} />)}</div>
        </div>
      )}
      <Section title="Categories · where the margin really comes from">
        {r.rows.length === 0 ? <Row2 a="No sales in range" b="" /> : r.rows.map((x, i) => (
          <div key={i} data-testid="cat-row" className="px-3.5 py-3 border-b border-slate-50 last:border-0">
            <div className="flex items-center gap-2"><span className={'w-2.5 h-2.5 rounded-full ' + colors[i % colors.length]} /><span className="text-[14px] font-semibold text-slate-800 flex-1 truncate">{x.group}</span><span className="text-[14px] font-bold">{inr(x.sale)}</span></div>
            <div className="grid grid-cols-4 gap-2 mt-2 text-[11px]">
              <div><div className="text-slate-400">Rev share</div><div className="font-semibold">{x.rev_share}%</div></div>
              <div><div className="text-slate-400">Margin</div><div className={'font-semibold ' + (x.margin >= 0 ? 'text-emerald-700' : 'text-red-600')}>{inr(x.margin)} · {x.margin_pct}%</div></div>
              <div><div className="text-slate-400">Margin share</div><div className={'font-semibold ' + (x.margin_share > x.rev_share ? 'text-emerald-700' : 'text-slate-700')}>{x.margin_share}%</div></div>
              <div><div className="text-slate-400">Per unit</div><div className="font-semibold">{inr(x.per_unit_margin)} · {x.units}u</div></div>
            </div>
          </div>
        ))}
      </Section>
    </>
  )
}

// 9. Price realisation
export function PriceRealisation({ from, to }) {
  const [r, setR] = useState(null)
  const [brand, setBrand] = useState('')
  useEffect(() => { setR(null); api.reportPrice(from, to, brand).then(setR) }, [from, to, brand])
  if (!r) return <SkeletonList rows={5} />
  const dl = () => exportSheet('price-realisation.xlsx',
    [['Model', 'Brand', 'Category', 'Qty', 'Avg purchase', 'Avg sale', 'Min sale', 'Max sale', 'Spread %', 'Margin %', 'Margin', 'Discount leak', 'Cheapest to', 'At rate'],
     ...r.rows.map((x) => [x.model, x.brand, x.group, x.qty, x.avg_cost, x.avg_sale, x.min_sale, x.max_sale, x.spread_pct, x.margin_pct, x.margin, x.leak, x.cheapest_dealer, x.cheapest_rate])],
    { money: [4, 5, 6, 7, 10, 11, 13], sheet: 'Price' })
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <SelPick testid="price-brand" label="All brands" value={brand} onChange={setBrand} options={r.brands || []} />
        <ExportBtn onClick={dl} />
      </div>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <Metric label="Models" value={r.rows.length} sub="sold in range" />
        <Metric label="Sold below cost" value={r.below_cost} sub="models" tone={r.below_cost > 0 ? 'text-red-600' : 'text-emerald-700'} />
        <Metric label="Discount leak" value={inr(r.total_leak)} sub="if all sold at avg rate" tone="text-amber-700" />
      </div>
      <Section title="Thinnest margin first · avg sale vs avg purchase per unit">
        {r.rows.length === 0 ? <Row2 a="No sales in range" b="" /> : r.rows.map((x, i) => (
          <div key={i} data-testid="price-row" className="px-3.5 py-3 border-b border-slate-50 last:border-0">
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-[13px] font-semibold text-slate-800 truncate">{x.model}</span>
              <span className={'text-[14px] font-bold shrink-0 ' + (x.margin_pct < 0 ? 'text-red-600' : x.margin_pct < 3 ? 'text-amber-700' : 'text-emerald-700')}>{x.margin_pct}%</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Buy {inr(x.avg_cost)} → sell avg {inr(x.avg_sale)} · {x.qty} units · margin {inr(x.margin)}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Range {inr(x.min_sale)} – {inr(x.max_sale)} ({x.spread_pct}% spread){x.leak > 0 ? ` · leak ${inr(x.leak)}` : ''}{x.cheapest_dealer ? ` · cheapest to ${x.cheapest_dealer} @ ${inr(x.cheapest_rate)}` : ''}</div>
          </div>
        ))}
      </Section>
    </>
  )
}

// 10. Cash-flow forecast
export function CashFlow() {
  const [r, setR] = useState(null)
  useEffect(() => { api.reportCashflow().then(setR) }, [])
  if (!r) return <SkeletonList rows={5} />
  const mx = Math.max(1, ...r.weeks.map((w) => w.amount))
  const dl = () => exportSheet('cashflow-forecast.xlsx',
    [['Dealer', 'Outstanding', 'Avg delay (d)', 'This week', 'Week 2', 'Week 3', 'Week 4', 'After 30 d', 'At risk'],
     ...r.rows.map((x) => [x.name, x.outstanding, x.avg_delay, x.w1, x.w2, x.w3, x.w4, x.beyond, x.risk]),
     ['Total', r.rows.reduce((s, x) => s + x.outstanding, 0), '', ...r.weeks.map((w) => w.amount), r.beyond, r.at_risk]],
    { money: [1, 3, 4, 5, 6, 7, 8], boldRows: [r.rows.length + 1], sheet: 'Cash flow' })
  return (
    <>
      <div className="flex justify-between items-start mb-3"><Big label={`Expected collections next 30 days · as of ${r.as_of}`} value={inr(r.next30)} tone="text-emerald-700" /><ExportBtn onClick={dl} /></div>
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 mb-3">
        {r.weeks.map((w) => (
          <div key={w.label} className="mb-2.5 last:mb-0">
            <div className="flex justify-between text-[12px] mb-1"><span className="font-semibold text-slate-700">{w.label} <span className="text-slate-400">(day {w.from}–{w.to})</span></span><span className="font-bold">{inr(w.amount)}</span></div>
            <Bar pct={w.amount / mx * 100} />
          </div>
        ))}
        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100">
          <div><div className="text-[10px] uppercase text-slate-400">After 30 days</div><div className="font-bold text-slate-700">{inr(r.beyond)}</div></div>
          <div><div className="text-[10px] uppercase text-slate-400">At risk (45 d past usual)</div><div className="font-bold text-red-600">{inr(r.at_risk)}</div></div>
        </div>
      </div>
      <Section title="Per dealer · based on each dealer's own payment history (avg delay)">
        {r.rows.length === 0 ? <Row2 a="Nothing outstanding" b="" /> : r.rows.map((x) => (
          <div key={x.id} data-testid="cf-row" className="px-3.5 py-2.5 border-b border-slate-50 last:border-0">
            <div className="flex justify-between text-[13px]"><span className="font-semibold text-slate-800 truncate pr-2">{x.name}</span><span className="font-bold shrink-0">{inr(x.outstanding)}</span></div>
            <div className="text-[11px] text-slate-500 mt-0.5">Usually pays in {x.avg_delay} d{x.has_history ? '' : ' (company avg)'} · this week {inr(x.w1)} · wk2 {inr(x.w2)} · wk3 {inr(x.w3)} · wk4 {inr(x.w4)}{x.beyond > 0 ? ` · later ${inr(x.beyond)}` : ''}{x.risk > 0 ? <span className="text-red-600"> · at risk {inr(x.risk)}</span> : ''}</div>
          </div>
        ))}
      </Section>
      <div className="text-[11px] text-slate-400">Each unpaid bill is expected on bill date + the dealer's average payment delay. Bills already 45+ days past that are marked at risk and excluded from the forecast.</div>
    </>
  )
}

// 11. Collector efficiency
export function CollectorEfficiency({ from, to }) {
  const [r, setR] = useState(null)
  const [pct, setPct] = useState(() => Number(localStorage.getItem('commission_pct') || 0))
  useEffect(() => { setR(null); localStorage.setItem('commission_pct', pct); api.reportCollectorEff(from, to, pct).then(setR) }, [from, to, pct])
  if (!r) return <SkeletonList rows={5} />
  const t = r.totals
  const dl = () => exportSheet('collector-efficiency.xlsx',
    [['Collector', 'Assigned dealers', 'Outstanding in area', 'Collected', 'Recovery %', 'Receipts', 'Visits', 'Dealers visited', 'Coverage %', 'Per visit', 'Cheques', 'Bounced', 'Commission @' + pct + '%'],
     ...r.rows.map((x) => [x.collector, x.assigned, x.outstanding, x.collected, x.recovery_pct, x.receipts, x.visits, x.visited, x.coverage_pct, x.per_visit, x.cheques, x.bounced, x.commission]),
     ['Total', '', t.outstanding, t.collected, '', '', t.visits, '', '', '', '', '', t.commission]],
    { money: [2, 3, 9, 12], boldRows: [r.rows.length + 1], sheet: 'Collectors' })
  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <label className="text-[12px] font-semibold text-slate-600 flex items-center gap-2">Commission %
          <input data-testid="commission-pct" type="number" step="0.25" min="0" max="20" value={pct} onChange={(e) => setPct(parseFloat(e.target.value) || 0)} className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-[13px]" /></label>
        <div className="ml-auto"><ExportBtn onClick={dl} /></div>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <Metric label="Collected" value={inr(t.collected)} sub={from + ' → ' + to} tone="text-emerald-700" />
        <Metric label="Outstanding in areas" value={inr(t.outstanding)} sub={t.visits + ' visits'} />
        <Metric label="Commission payable" value={inr(t.commission)} sub={'@ ' + pct + '%'} />
      </div>
      <Section title="Per collector">
        {r.rows.length === 0 ? <Row2 a="No collector activity" b="" /> : r.rows.map((x) => (
          <div key={x.id} data-testid="ce-row" className="px-3.5 py-3 border-b border-slate-50 last:border-0">
            <div className="flex justify-between items-baseline"><span className="text-[14px] font-semibold text-slate-800">{x.collector}</span><span className="text-[15px] font-bold text-emerald-700">{inr(x.collected)}</span></div>
            <div className="mt-1.5"><Bar pct={x.recovery_pct} tone={x.recovery_pct >= 50 ? 'bg-emerald-500' : 'bg-amber-400'} /></div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-2 text-[11px]">
              <div><div className="text-slate-400">Recovery</div><div className="font-semibold">{x.recovery_pct}%</div></div>
              <div><div className="text-slate-400">Area owes</div><div className="font-semibold">{inr(x.outstanding)}</div></div>
              <div><div className="text-slate-400">Coverage</div><div className="font-semibold">{x.visited}/{x.assigned} · {x.coverage_pct}%</div></div>
              <div><div className="text-slate-400">Per visit</div><div className="font-semibold">{inr(x.per_visit)} · {x.visits}v</div></div>
              <div><div className="text-slate-400">Cheques</div><div className={'font-semibold ' + (x.bounced ? 'text-red-600' : '')}>{x.cheques}{x.bounced ? ` · ${x.bounced} bounced` : ''}</div></div>
              <div><div className="text-slate-400">Commission</div><div className="font-semibold">{inr(x.commission)}</div></div>
            </div>
          </div>
        ))}
      </Section>
    </>
  )
}

// 12. Scheme tracker
export function SchemeTracker() {
  const [r, setR] = useState(null)
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [open, setOpen] = useState(false)
  const [recv, setRecv] = useState(null)   // scheme being marked received
  const blank = { basis: 'purchase', brand: '', scope: 'all', scope_value: '', target_qty: '', target_amount: '', payout_pct: '', payout_amount: '', prorata: false, note: '', custom: false, date_from: '', date_to: '' }
  const [f, setF] = useState(blank)
  const load = () => { setR(null); api.schemesList(month).then(setR) }
  useEffect(load, [month]) // eslint-disable-line
  if (!r) return <SkeletonList rows={5} />
  const save = async () => {
    try {
      await api.schemeCreate({ month, date_from: f.custom ? f.date_from : '', date_to: f.custom ? f.date_to : '', basis: f.basis, brand: f.brand, scope: f.scope, scope_value: f.scope_value, target_qty: +f.target_qty || 0, target_amount: +f.target_amount || 0, payout_pct: +f.payout_pct || 0, payout_amount: +f.payout_amount || 0, prorata: f.prorata, note: f.note })
      toast.success('Scheme added'); setF(blank); setOpen(false); load()
    } catch (e) { toast.error(e.message) }
  }
  const setStatus = async (x, status, received_amount = 0, received_on = '') => {
    try { await api.schemeStatus(x.id, { status, received_amount, received_on }); toast.success(status === 'received' ? 'Marked received' : status === 'claimed' ? 'Marked claimed' : 'Reopened'); setRecv(null); load() } catch (e) { toast.error(e.message) }
  }
  const del = async (id) => { if (!confirm('Remove this scheme?')) return; await api.schemeDelete(id); load() }
  const dl = () => exportSheet('schemes-' + month + '.xlsx',
    [['Basis', 'Brand', 'Scope', 'Target qty', 'Actual qty', 'Target amount', 'Actual amount', 'Achieved %', '% income', 'Payout earned', 'Potential', 'Gap qty', 'Gap amount', 'Status', 'Received', 'Received on', 'Note'],
     ...r.rows.map((x) => [x.basis, x.brand || 'All', x.scope === 'all' ? 'All models' : x.scope_value, x.target_qty, x.actual_qty, x.target_amount, x.actual_amount, x.achieved_pct, x.pct_income, x.earned, x.potential, x.gap_qty, x.gap_amount, x.status, x.received_amount, x.received_on || '', x.note])],
    { money: [5, 6, 8, 9, 10, 12, 14], sheet: 'Schemes' })
  const inp = 'border border-slate-200 rounded-lg px-2.5 py-2 text-[13px] w-full'
  const ST = { open: ['slate', 'Open'], claimed: ['amber', 'Claimed'], received: ['green', 'Received'] }
  const hasTarget = f.target_qty || f.target_amount
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input data-testid="scheme-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="border border-slate-200 rounded-lg px-2 py-1.5 text-[13px]" />
        <button data-testid="scheme-add" onClick={() => setOpen(!open)} className="text-[12px] font-semibold text-white bg-emerald-600 rounded-full px-3.5 py-1.5">+ Add scheme</button>
        <div className="ml-auto"><ExportBtn onClick={dl} /></div>
      </div>
      {open && (
        <div className="bg-white border border-emerald-200 rounded-xl p-3.5 mb-3">
          <div className="flex gap-2 mb-3">
            {[['purchase', 'On purchases (what you buy from the brand)'], ['sale', 'On sales (what you sell to dealers)']].map(([k, l]) => (
              <button key={k} data-testid={'scheme-basis-' + k} onClick={() => setF({ ...f, basis: k })} className={'flex-1 text-[12px] font-semibold px-3 py-2 rounded-lg border ' + (f.basis === k ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500')}>{l}</button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 mb-3 text-[12px]">
            <label className="flex items-center gap-2 text-slate-600"><input type="checkbox" data-testid="scheme-custom" checked={f.custom} onChange={(e) => setF({ ...f, custom: e.target.checked })} /> Custom period (not the whole month)</label>
            {f.custom && <><input data-testid="scheme-from" type="date" value={f.date_from} onChange={(e) => setF({ ...f, date_from: e.target.value })} className="border border-slate-200 rounded-lg px-2 py-1.5" /><span className="text-slate-400">to</span><input data-testid="scheme-to" type="date" value={f.date_to} onChange={(e) => setF({ ...f, date_to: e.target.value })} className="border border-slate-200 rounded-lg px-2 py-1.5" /></>}
            {!f.custom && <span className="text-slate-400">Runs for the full month {month}</span>}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <label className="text-[11px] font-semibold text-slate-500">Brand<select className={inp} value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })}><option value="">All</option>{r.brands.map((b) => <option key={b}>{b}</option>)}</select></label>
            <label className="text-[11px] font-semibold text-slate-500">Applies to<select className={inp} value={f.scope} onChange={(e) => setF({ ...f, scope: e.target.value, scope_value: '' })}><option value="all">All models</option><option value="group">Category</option><option value="model">Model</option></select></label>
            {f.scope !== 'all' && <label className="text-[11px] font-semibold text-slate-500">{f.scope === 'group' ? 'Category' : 'Model'}<select className={inp} value={f.scope_value} onChange={(e) => setF({ ...f, scope_value: e.target.value })}><option value="">Select…</option>{(f.scope === 'group' ? r.groups : r.models).map((g) => <option key={g}>{g}</option>)}</select></label>}
            <label className="text-[11px] font-semibold text-slate-500">Target qty <span className="text-slate-400">(optional)</span><input data-testid="scheme-target-qty" className={inp} type="number" value={f.target_qty} onChange={(e) => setF({ ...f, target_qty: e.target.value })} /></label>
            <label className="text-[11px] font-semibold text-slate-500">Target amount ₹ <span className="text-slate-400">(optional)</span><input className={inp} type="number" value={f.target_amount} onChange={(e) => setF({ ...f, target_amount: e.target.value })} /></label>
            <label className="text-[11px] font-semibold text-slate-500">% on {f.basis} value<input data-testid="scheme-payout-pct" className={inp} type="number" step="0.25" value={f.payout_pct} onChange={(e) => setF({ ...f, payout_pct: e.target.value })} placeholder="e.g. 2" /></label>
            <label className="text-[11px] font-semibold text-slate-500">Flat payout ₹ on target<input className={inp} type="number" value={f.payout_amount} onChange={(e) => setF({ ...f, payout_amount: e.target.value })} /></label>
            <label className="text-[11px] font-semibold text-slate-500">Note<input className={inp} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="e.g. Sep W/M push" /></label>
            {hasTarget ? <label className="text-[12px] text-slate-600 flex items-center gap-2 self-end"><input type="checkbox" checked={f.prorata} onChange={(e) => setF({ ...f, prorata: e.target.checked })} /> Pay pro-rata below target</label> : <div className="text-[11px] text-slate-400 self-end">No target → the % simply accrues on every {f.basis}.</div>}
          </div>
          <div className="flex gap-2 mt-3"><button data-testid="scheme-save" onClick={save} className="text-[13px] font-semibold text-white bg-emerald-600 rounded-lg px-4 py-2">Save</button><button onClick={() => setOpen(false)} className="text-[13px] font-semibold text-slate-500 px-3">Cancel</button></div>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        <Metric label="Earned so far" value={inr(r.earned)} sub={month} tone="text-emerald-700" />
        <Metric label="To claim" value={inr(r.pending_claim)} sub="earned, not yet claimed" tone={r.pending_claim > 0 ? 'text-amber-700' : 'text-slate-900'} />
        <Metric label="Received" value={inr(r.received)} sub="credited by brand" />
        <Metric label="Behind pace" value={r.behind} sub={'month ' + r.month_progress_pct + '% done'} tone={r.behind > 0 ? 'text-red-600' : 'text-emerald-700'} />
      </div>
      <Section title={r.rows.length + ' scheme(s) · achievement vs target'}>
        {r.rows.length === 0 ? <Row2 a="No schemes for this month — add Haier targets above" b="" /> : r.rows.map((x) => {
          const [tone, label] = ST[x.status] || ST.open
          return (
            <div key={x.id} data-testid="scheme-row" className="px-3.5 py-3 border-b border-slate-50 last:border-0">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold text-slate-800 truncate">{x.brand || 'All brands'} · {x.scope === 'all' ? 'All models' : x.scope_value}</div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1"><Tag tone="blue">on {x.basis}s</Tag>{x.date_from && <Tag tone="slate">{x.period_from} → {x.period_to}</Tag>}<Tag tone={tone}>{label}</Tag>{x.behind && <Tag tone="red">Behind pace</Tag>}{x.note && <span className="text-[11px] text-slate-400">{x.note}</span>}</div>
                </div>
                <div className="text-right shrink-0"><div className={'text-[15px] font-bold ' + (x.met ? 'text-emerald-700' : 'text-slate-700')}>{x.met ? inr(x.earned) : inr(x.potential)}</div><div className="text-[10px] text-slate-400">{x.met ? 'earned' : 'if target met'}</div></div>
              </div>
              {!x.no_target && <>
                <div className="mt-2"><Bar pct={x.achieved_pct} tone={x.met ? 'bg-emerald-500' : x.behind ? 'bg-red-400' : 'bg-sky-500'} /></div>
                <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span><b className="text-slate-800">{x.achieved_pct}%</b>{x.target_qty ? ` · ${x.actual_qty}/${x.target_qty} units` : ''}{x.target_amount ? ` · ${inr(x.actual_amount)}/${inr(x.target_amount)}` : ''}</span>
                  <span>{x.met ? <Tag tone="green">Target met</Tag> : <>need {x.gap_qty ? x.gap_qty + ' more units' : inr(x.gap_amount) + ' more'}</>}</span>
                </div>
              </>}
              <div className="text-[11px] text-slate-500 mt-1">{x.basis === 'purchase' ? 'Purchased' : 'Sold'} {inr(x.actual_amount)} · {x.actual_qty} units{x.payout_pct ? <> · <b className="text-slate-700">{x.payout_pct}% = {inr(x.pct_income)}</b></> : ''}{x.payout_amount ? ` · flat ${inr(x.payout_amount)}` : ''}{x.status === 'received' ? <> · received <b className="text-emerald-700">{inr(x.received_amount)}</b> on {x.received_on}</> : ''}</div>
              <div className="flex flex-wrap gap-2 mt-2">
                {x.status === 'open' && <button data-testid="scheme-claim" onClick={() => setStatus(x, 'claimed')} className="text-[11px] font-semibold text-amber-800 bg-amber-50 rounded-full px-2.5 py-1">Mark claimed</button>}
                {x.status !== 'received' && <button data-testid="scheme-receive" onClick={() => setRecv({ id: x.id, amount: x.earned || x.pct_income, on: new Date().toISOString().slice(0, 10) })} className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded-full px-2.5 py-1">Mark received</button>}
                {x.status !== 'open' && <button onClick={() => setStatus(x, 'open')} className="text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-full px-2.5 py-1">Reopen</button>}
                <button onClick={() => del(x.id)} className="text-[11px] text-red-500 ml-auto">Remove</button>
              </div>
              {recv && recv.id === x.id && (
                <div className="mt-2 flex flex-wrap items-end gap-2 bg-emerald-50 border border-emerald-100 rounded-lg p-2.5">
                  <label className="text-[11px] font-semibold text-slate-600">Amount received ₹<input data-testid="scheme-recv-amount" type="number" className={inp} value={recv.amount} onChange={(e) => setRecv({ ...recv, amount: e.target.value })} /></label>
                  <label className="text-[11px] font-semibold text-slate-600">On<input type="date" className={inp} value={recv.on} onChange={(e) => setRecv({ ...recv, on: e.target.value })} /></label>
                  <button data-testid="scheme-recv-save" onClick={() => setStatus(x, 'received', +recv.amount || 0, recv.on)} className="text-[12px] font-semibold text-white bg-emerald-600 rounded-lg px-3 py-2">Save</button>
                  <button onClick={() => setRecv(null)} className="text-[12px] text-slate-500 px-2">Cancel</button>
                </div>
              )}
            </div>
          )
        })}
      </Section>
      <div className="text-[11px] text-slate-400">Achievement is measured on your imported {'{'}purchase / sale{'}'} files for the month. A % with no target accrues on every unit; "Behind pace" means achievement is more than 5 points below the share of the month elapsed.</div>
    </>
  )
}

// 13. Daily digest
export function Digest() {
  const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10) }
  const [day, setDay] = useState(yesterday())
  const [r, setR] = useState(null)
  useEffect(() => { setR(null); api.reportDigest(day).then(setR) }, [day])
  if (!r) return <SkeletonList rows={5} />
  const text = () => {
    const L = [`*Ashoka Distribution — Daily digest ${r.day}*`, '',
      `📦 Sales: ${inr(r.sales.amount)} · ${r.sales.units} units · ${r.sales.bills} bills`,
      ...r.sales.by_dealer.slice(0, 5).map((d) => `   • ${d.dealer}: ${inr(d.amount)}`),
      `💰 Collections: ${inr(r.collections.amount)} · ${r.collections.receipts} receipts`,
      ...r.collections.rows.slice(0, 5).map((c) => `   • ${c.dealer}: ${inr(c.amount)} (${c.mode})`),
      `📒 Total outstanding: ${inr(r.outstanding)} · 90+ days: ${inr(r.over90)}`,
      ...r.top_overdue.slice(0, 3).map((t) => `   • ${t.dealer}: ${inr(t.outstanding)}${t.age_90p ? ` (${inr(t.age_90p)} over 90d)` : ''}`),
      r.low_stock.length ? `⚠️ Low stock: ${r.low_stock.slice(0, 5).map((l) => `${l.model} (${l.on_hand} left, ${l.sold_30d} sold/30d)`).join('; ')}` : '✅ No low-stock alerts',
      `🚶 Visits: ${r.visits}${r.new_dealers ? ` · New dealers: ${r.new_dealers}` : ''}`]
    return L.join('\n')
  }
  const share = async () => {
    const t = text()
    if (navigator.share) { try { await navigator.share({ text: t }); return } catch { /* fallthrough */ } }
    window.open('https://wa.me/?text=' + encodeURIComponent(t), '_blank')
  }
  const copy = async () => { await navigator.clipboard.writeText(text()); toast.success('Copied — paste in WhatsApp') }
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input data-testid="digest-day" type="date" value={day} onChange={(e) => setDay(e.target.value)} className="border border-slate-200 rounded-lg px-2 py-1.5 text-[13px]" />
        <div className="ml-auto flex gap-2">
          <button data-testid="digest-copy" onClick={copy} className="text-[12px] font-semibold text-slate-700 bg-slate-100 rounded-full px-3 py-1.5">Copy</button>
          <button data-testid="digest-share" onClick={share} className="text-[12px] font-semibold text-white bg-emerald-600 rounded-full px-3.5 py-1.5">Share on WhatsApp</button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        <Metric label="Sales" value={inr(r.sales.amount)} sub={r.sales.units + ' units · ' + r.sales.bills + ' bills'} tone="text-emerald-700" />
        <Metric label="Collections" value={inr(r.collections.amount)} sub={r.collections.receipts + ' receipts'} />
        <Metric label="Outstanding" value={inr(r.outstanding)} sub={'90+ d: ' + inr(r.over90)} tone={r.over90 > 0 ? 'text-red-600' : 'text-slate-900'} />
        <Metric label="Visits" value={r.visits} sub={r.new_dealers ? r.new_dealers + ' new dealers' : 'field activity'} />
      </div>
      <Section title="Sales by dealer">{r.sales.by_dealer.length === 0 ? <Row2 a="No sales" b="" /> : r.sales.by_dealer.map((d, i) => <Row2 key={i} a={d.dealer} b={inr(d.amount)} />)}</Section>
      <Section title="Collections">{r.collections.rows.length === 0 ? <Row2 a="No collections" b="" /> : r.collections.rows.map((c, i) => <Row2 key={i} a={`${c.dealer} · ${c.mode} · ${c.collector}`} b={inr(c.amount)} />)}</Section>
      <Section title="Top overdue">{r.top_overdue.length === 0 ? <Row2 a="Nothing overdue" b="" /> : r.top_overdue.map((t, i) => <Row2 key={i} a={t.dealer + (t.age_90p ? ` · ${inr(t.age_90p)} over 90d` : '')} b={inr(t.outstanding)} />)}</Section>
      <Section title="Low stock (≤2 left, sold in last 30 days)">{r.low_stock.length === 0 ? <Row2 a="No alerts" b="" /> : r.low_stock.map((l, i) => <Row2 key={i} a={l.model} b={`${l.on_hand} left · ${l.sold_30d} sold`} />)}</Section>
      <pre data-testid="digest-text" className="bg-slate-900 text-slate-100 text-[11px] rounded-xl p-3.5 whitespace-pre-wrap leading-relaxed">{text()}</pre>
    </>
  )
}

// 14. Daily sales (single day, filterable)
export function DailySales({ initial }) {
  const [day, setDay] = useState(initial || new Date().toISOString().slice(0, 10))
  const [r, setR] = useState(null)
  const [f, setF] = useState({ brand: '', dealer: '', model: '' })
  const [opts, setOpts] = useState({ dealers: [], models: [], brands: [] })
  const load = (d, ff) => { setR(null); api.reportSales(d, d, '', ff).then((x) => { setR(x); setOpts({ dealers: x.dealers || [], models: x.models || [], brands: x.brands || [] }) }) }
  useEffect(() => { load(day, f) }, [day]) // eslint-disable-line
  const setFilter = (k, v) => { const nf = { ...f, [k]: v }; setF(nf); load(day, nf) }
  const shift = (n) => { const d = new Date(day); d.setDate(d.getDate() + n); setDay(d.toISOString().slice(0, 10)) }
  if (!r) return <SkeletonList rows={5} />
  const byBill = {}
  r.rows.forEach((x) => { const b = byBill[x.bill_no] = byBill[x.bill_no] || { bill_no: x.bill_no, dealer: x.dealer, amount: 0, lines: [] }; b.amount += x.amount; b.lines.push(x) })
  const bills = Object.values(byBill).sort((a, b) => b.amount - a.amount)
  const dl = () => exportSheet('sales-' + day + '.xlsx',
    [['Date', 'Bill', 'Dealer', 'Brand', 'Model', 'IMEI', 'Qty', 'Rate', 'Amount'], ...r.rows.map((x) => [x.date, x.bill_no, x.dealer, x.brand, x.model, x.imei, x.qty, x.rate, x.amount]), ['Total', '', '', '', '', '', r.units, '', r.total]],
    { money: [7, 8], boldRows: [r.rows.length + 1], sheet: 'Sales ' + day })
  const isToday = day === new Date().toISOString().slice(0, 10)
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button data-testid="daily-prev" onClick={() => shift(-1)} className="text-[13px] font-bold text-slate-600 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">‹</button>
        <input data-testid="daily-day" type="date" value={day} onChange={(e) => setDay(e.target.value)} className="border border-slate-200 rounded-lg px-2 py-1.5 text-[13px]" />
        <button data-testid="daily-next" onClick={() => shift(1)} disabled={isToday} className="text-[13px] font-bold text-slate-600 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 disabled:opacity-40">›</button>
        {!isToday && <button onClick={() => setDay(new Date().toISOString().slice(0, 10))} className="text-[12px] font-semibold text-emerald-700">Today</button>}
        <div className="ml-auto"><ExportBtn onClick={dl} /></div>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <Metric label={isToday ? 'Sales today' : 'Sales on ' + day} value={inr(r.total)} sub={bills.length + ' bills'} tone="text-emerald-700" />
        <Metric label="Units" value={r.units || r.rows.reduce((s, x) => s + (x.qty || 0), 0)} sub={r.count + ' lines'} />
        <Metric label="Dealers" value={r.by_dealer.length} sub="billed" />
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <SelPick testid="daily-brand" label="All brands" value={f.brand} onChange={(v) => setFilter('brand', v)} options={opts.brands} />
        <SelPick testid="daily-dealer" label="All dealers" value={f.dealer} onChange={(v) => setFilter('dealer', v)} options={opts.dealers} />
        <SelPick testid="daily-model" label="All models" value={f.model} onChange={(v) => setFilter('model', v)} options={opts.models} />
        {(f.brand || f.dealer || f.model) && <button onClick={() => { const nf = { brand: '', dealer: '', model: '' }; setF(nf); load(day, nf) }} className="text-[12px] font-semibold text-slate-500 underline">Clear</button>}
      </div>
      <Section title="By dealer">
        {r.by_dealer.length === 0 ? <Row2 a="No sales on this day" b="" /> : r.by_dealer.map((d, i) => <Row2 key={i} a={`${d.dealer} · ${d.qty} units`} b={inr(d.amount)} bold />)}
      </Section>
      <Section title="Models sold">
        {r.by_model.length === 0 ? <Row2 a="—" b="" /> : r.by_model.map((m, i) => <Row2 key={i} a={`${m.model} · ${m.qty}`} b={inr(m.amount)} />)}
      </Section>
      <Section title={'Bills · ' + bills.length}>
        {bills.length === 0 ? <Row2 a="—" b="" /> : bills.map((b) => (
          <div key={b.bill_no} data-testid="daily-bill" className="px-3.5 py-2.5 border-b border-slate-50 last:border-0">
            <div className="flex justify-between text-[13px]"><span className="font-semibold text-slate-800 truncate pr-2">{b.dealer} <span className="text-slate-400 font-normal">· {b.bill_no}</span></span><span className="font-bold shrink-0">{inr(b.amount)}</span></div>
            {b.lines.map((l, i) => <div key={i} className="text-[11px] text-slate-500 mt-0.5 flex justify-between"><span className="truncate pr-2">{l.model}{l.imei ? ` · ${l.imei}` : ''}{l.qty > 1 ? ` × ${l.qty}` : ''}</span><span>{inr(l.amount)}</span></div>)}
          </div>
        ))}
      </Section>
    </>
  )
}

// 15. Purchases report
export function PurchasesReport({ from, to }) {
  const [r, setR] = useState(null)
  const [f, setF] = useState({ brand: '', supplier: '', model: '', group: '' })
  const [opts, setOpts] = useState({ brands: [], suppliers: [], models: [], groups: [] })
  const [view, setView] = useState('bills')
  useEffect(() => { setR(null); api.reportPurchases(from, to, f).then((x) => { setR(x); setOpts({ brands: x.brands, suppliers: x.suppliers, models: x.models, groups: x.groups }) }) }, [from, to, f])
  if (!r) return <SkeletonList rows={5} />
  const setFilter = (k, v) => setF({ ...f, [k]: v })
  const tag = [f.brand, f.supplier, f.group, f.model].filter(Boolean).join(' · ')
  const dl = () => exportSheet('purchases-' + (tag || 'all').replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.xlsx',
    [['Date', 'Bill', 'Supplier', 'Brand', 'Category', 'Model', 'IMEI', 'Qty', 'Rate', 'Amount', 'Sold?'],
     ...r.rows.map((x) => [x.date, x.bill_no, x.supplier, x.brand, x.group, x.model, x.imei, x.qty, x.rate, x.amount, x.sold ? 'Yes' : '']),
     ['Total', '', '', '', '', '', '', r.units, '', r.total, '']],
    { money: [8, 9], boldRows: [r.rows.length + 1], sheet: 'Purchases' })
  const dlModel = () => exportSheet('purchases-by-model.xlsx', [['Model', 'Brand', 'Qty', 'Avg rate', 'Amount', 'Sold'], ...r.by_model.map((x) => [x.model, x.brand, x.qty, x.avg_rate, x.amount, x.sold])], { money: [3, 4], sheet: 'By model' })
  return (
    <>
      <Big label={`Purchases · ${tag || 'All'} · ${from} to ${to} · ${r.bills} bills · ${r.count} lines`} value={inr(r.total)} />
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <SelPick testid="pur-brand" label="All brands" value={f.brand} onChange={(v) => setFilter('brand', v)} options={opts.brands} />
        <SelPick testid="pur-supplier" label="All suppliers" value={f.supplier} onChange={(v) => setFilter('supplier', v)} options={opts.suppliers} />
        <SelPick testid="pur-group" label="All categories" value={f.group} onChange={(v) => setFilter('group', v)} options={opts.groups} />
        <SelPick testid="pur-model" label="All models" value={f.model} onChange={(v) => setFilter('model', v)} options={opts.models} />
        {tag && <button onClick={() => setF({ brand: '', supplier: '', model: '', group: '' })} className="text-[12px] font-semibold text-slate-500 underline">Clear</button>}
        <div className="ml-auto"><ExportBtn onClick={dl} /></div>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <Metric label="Units bought" value={r.units} sub={r.count + ' lines'} />
        <Metric label="Suppliers" value={r.by_supplier.length} sub={r.by_supplier[0] ? r.by_supplier[0].supplier : ''} />
        <Metric label="Categories" value={r.by_group.length} sub={r.by_group[0] ? r.by_group[0].group + ' ' + inr(r.by_group[0].amount) : ''} />
      </div>
      <div className="flex gap-1.5 mb-3">
        {[['bills', 'By bill'], ['supplier', 'By supplier'], ['model', 'By model'], ['group', 'By category'], ['lines', 'All lines']].map(([k, l]) => (
          <button key={k} data-testid={'pur-view-' + k} onClick={() => setView(k)} className={'text-[12px] font-semibold px-3 py-1.5 rounded-full border ' + (view === k ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500')}>{l}</button>
        ))}
      </div>
      {view === 'bills' && <Section title={r.by_bill.length + ' purchase bills'}>{r.by_bill.length === 0 ? <Row2 a="No purchases in range" b="" /> : r.by_bill.map((b, i) => (
        <div key={i} data-testid="pur-bill" className="px-3.5 py-2.5 border-b border-slate-50 last:border-0 flex justify-between text-[13px]"><div><div className="font-semibold text-slate-800">{b.bill_no} <span className="text-slate-400 font-normal">· {b.date}</span></div><div className="text-[11px] text-slate-500">{b.supplier} · {b.qty} units · {b.lines} lines</div></div><span className="font-bold shrink-0">{inr(b.amount)}</span></div>))}</Section>}
      {view === 'supplier' && <Section title="By supplier">{r.by_supplier.map((x, i) => <Row2 key={i} a={`${x.supplier} · ${x.bills} bills · ${x.qty} units`} b={inr(x.amount)} bold />)}</Section>}
      {view === 'model' && <Section title="By model" action={<ExportBtn onClick={dlModel} />}>{r.by_model.map((x, i) => (
        <div key={i} className="px-3.5 py-2.5 border-b border-slate-50 last:border-0"><div className="flex justify-between text-[13px]"><span className="font-semibold text-slate-800 truncate pr-2">{x.model}</span><span className="font-bold shrink-0">{inr(x.amount)}</span></div><div className="text-[11px] text-slate-500 mt-0.5">{x.brand} · {x.qty} bought @ avg {inr(x.avg_rate)} · {x.sold} sold · {x.qty - x.sold} in stock</div></div>))}</Section>}
      {view === 'group' && <Section title="By category">{r.by_group.map((x, i) => <Row2 key={i} a={`${x.group} · ${x.qty} units`} b={inr(x.amount)} bold />)}</Section>}
      {view === 'lines' && <Section title={'Lines · ' + r.rows.length}>{r.rows.slice(0, 500).map((x, i) => (
        <div key={i} className="px-3.5 py-2 border-b border-slate-50 last:border-0"><div className="flex justify-between text-[13px]"><span className="font-semibold text-slate-800 truncate pr-2">{x.model}</span><span className="font-bold shrink-0">{inr(x.amount)}</span></div><div className="text-[10px] text-slate-400">{x.date} · {x.bill_no} · {x.supplier}{x.imei ? ` · ${x.imei}` : ` · qty ${x.qty}`}{x.sold ? ' · sold' : ''}</div></div>))}</Section>}
    </>
  )
}
