import { inr } from '../lib/format.js'
import { Trash2 } from 'lucide-react'

const BUCKETS = { age_0_30: '0–30', age_31_60: '31–60', age_61_90: '61–90', age_90p: '90+' }
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function monthLabel(d) {
  if (!d) return ''
  const [y, m] = d.split('-')
  return `${MONTHS[(+m || 1) - 1]} ${y}`
}
function fmtDay(d) {
  if (!d) return ''
  const [, m, day] = d.split('-')
  return `${day} ${MONTHS[(+m || 1) - 1]}`
}

const AGE = [['age_0_30', '0–30', '#0E7C66'], ['age_31_60', '31–60', '#5B8A72'],
  ['age_61_90', '61–90', '#B4884A'], ['age_90p', '90+', '#B23A32']]

// Header card: outstanding, credit-limit usage, ageing bar, last payment.
export function LedgerHeader({ name, outstanding, ageing = {}, creditLimit = 0, lastPayment }) {
  const total = AGE.reduce((s, [k]) => s + (ageing[k] || 0), 0) || 1
  const over = creditLimit > 0 && outstanding > creditLimit
  const pct = creditLimit > 0 ? Math.min(100, (outstanding / creditLimit) * 100) : 0
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 mb-3">
      {name && <div className="text-lg font-bold leading-tight">{name}</div>}
      <div className="flex items-baseline gap-2 mt-1">
        <div className="text-[26px] font-extrabold tracking-tight">{inr(outstanding)}</div>
        <div className="text-[11px] text-slate-500">outstanding</div>
      </div>

      {creditLimit > 0 && (
        <>
          <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden mt-2">
            <div className={'h-full ' + (over ? 'bg-red-600' : 'bg-emerald-600')} style={{ width: pct + '%' }} />
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            of {inr(creditLimit)} limit{over && <span className="text-red-700 font-semibold"> · over limit</span>}
          </div>
        </>
      )}

      {outstanding > 0 && (
        <div className="mt-3">
          <div className="flex h-2 rounded-full overflow-hidden bg-slate-100">
            {AGE.map(([k, , c]) => (ageing[k] > 0 ? <div key={k} style={{ width: (ageing[k] / total) * 100 + '%', background: c }} /> : null))}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
            {AGE.map(([k, label, c]) => (ageing[k] > 0 ? (
              <span key={k} className="text-[10.5px] text-slate-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm inline-block" style={{ background: c }} />{label}: <b className="text-slate-700">{inr(ageing[k])}</b>
              </span>
            ) : null))}
          </div>
        </div>
      )}

      {lastPayment && (
        <div className="text-[12px] text-slate-500 mt-3 pt-2 border-t border-slate-100">
          Last payment <b className="text-emerald-700">{inr(lastPayment.amount)}</b> · {fmtDay(lastPayment.date)} {lastPayment.date?.slice(0, 4)}
        </div>
      )}
    </div>
  )
}

// Traditional khata: oldest at top, balance builds down, grouped by month.
export function LedgerTable({ entries = [], onDelete }) {
  if (!entries.length) {
    return <div className="bg-white border border-slate-200 rounded-xl p-4 text-[12px] text-slate-400">No entries yet.</div>
  }
  let lastMonth = null
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center px-3 py-2 bg-slate-50 border-b border-slate-200 text-[10.5px] font-bold text-slate-500 uppercase tracking-wide">
        <div className="flex-1">Particulars</div>
        <div className="w-20 text-right">Debit</div>
        <div className="w-20 text-right">Credit</div>
        <div className="w-24 text-right">Balance</div>
      </div>
      {entries.map((e, i) => {
        const m = monthLabel(e.date)
        const showMonth = m !== lastMonth
        lastMonth = m
        const isBill = e.type === 'bill'
        return (
          <div key={i}>
            {showMonth && <div className="px-3 py-1 bg-slate-50/70 text-[10.5px] font-semibold text-slate-400 border-b border-slate-100">{m}</div>}
            <div className="flex items-center px-3 py-2.5 border-b border-slate-50 last:border-0 text-[13px]">
              <div className="flex-1 min-w-0 pr-2">
                <div className="font-semibold text-slate-800 truncate">
                  {isBill ? (e.ref === 'Opening' ? 'Opening balance' : 'Bill ' + e.ref) : (e.mode || 'Payment') + (e.ref && e.ref !== e.mode ? ' ' + e.ref : '')}
                </div>
                <div className="text-[11px] text-slate-400">
                  {fmtDay(e.date)}
                  {isBill && e.debit > 0 && e.days != null && e.ref !== 'Opening' && (
                    <span className={e.bucket === 'age_90p' ? 'text-red-600 font-semibold' : ''}> · {e.days}d ({BUCKETS[e.bucket]})</span>
                  )}
                </div>
              </div>
              <div className="w-20 text-right font-semibold text-slate-800">{e.debit ? inr(e.debit) : ''}</div>
              <div className="w-20 text-right font-semibold text-emerald-700">{e.credit ? inr(e.credit) : ''}</div>
              <div className="w-24 text-right font-bold text-slate-900">{inr(e.balance)}</div>
              {onDelete && <div className="w-7 text-right">{e.type === 'payment' && e.id ? <button onClick={() => onDelete(e)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={13} /></button> : null}</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
