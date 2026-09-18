import { useEffect, useState } from 'react'
import { api } from '../../api/client.js'
import { toast } from '../../lib/toast.js'
import { inr } from '../../lib/format.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { Spin } from '../../components/ui.jsx'
import { Hero, ModeBar, Stat, Section, PageHead, DateNav, Field, inp, PrimaryBtn, today, niceDate } from './bits.jsx'

export default function DayClose() {
  const { auth } = useAuth()
  const admin = auth.user.role === 'admin'
  const [date, setDate] = useState(today())
  const [d, setD] = useState(null)
  const [f, setF] = useState({ float_open: '', handover: '', note: '' })
  const load = () => api.dcDay(date).then((x) => { setD(x); setF({ float_open: x.float_open || '', handover: x.handover || '', note: x.note || '' }) })
  useEffect(() => { setD(null); load() }, [date]) // eslint-disable-line
  const save = async () => { await api.dcSaveRecon({ date, float_open: +f.float_open || 0, handover: +f.handover || 0, note: f.note }); toast.success('Day closed & saved'); load() }
  if (!d) return <Spin />
  const expected = (+f.float_open || 0) + d.cash_in - d.expenses
  const diff = expected - (+f.handover || 0)
  const ok = diff === 0 && +f.handover > 0
  return (
    <>
      <PageHead title="Day close" sub={niceDate(date)} right={<DateNav date={date} setDate={setDate} testid="dc-close-date" />} />
      <Hero eyebrow="Day total" value={inr(d.total)} sub={d.bills + ' bills · ' + inr(d.pending) + ' pending · ' + inr(d.expenses) + ' expenses'}>
        <ModeBar d={d} dark />
      </Hero>
      {admin && <div className="grid grid-cols-2 gap-2.5 mt-3"><Stat label="NLC / cost" v={inr(d.nlc || 0)} /><Stat label="Profit" v={inr(d.profit || 0)} tone="text-emerald-600" /></div>}

      <Section title="Cash reconciliation">
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-soft p-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Opening float"><input data-testid="dc-float" className={inp} type="number" inputMode="decimal" placeholder="₹ 0" value={f.float_open} onChange={(e) => setF((p) => ({ ...p, float_open: e.target.value }))} /></Field>
            <Field label="Cash handed over"><input data-testid="dc-handover" className={inp} type="number" inputMode="decimal" placeholder="₹ 0" value={f.handover} onChange={(e) => setF((p) => ({ ...p, handover: e.target.value }))} /></Field>
          </div>
          <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200/80 divide-y divide-slate-200/70 text-[13px]">
            <L k="Opening float" v={inr(+f.float_open || 0)} />
            <L k="+ Cash collected" v={inr(d.cash_in)} />
            <L k="− Expenses" v={inr(d.expenses)} tone="text-rose-700" />
            <L k="Expected in drawer" v={inr(expected)} bold />
            <L k="− Handed over" v={inr(+f.handover || 0)} />
          </div>
          <div data-testid="dc-close-diff" className={'mt-3 rounded-xl px-4 py-3 flex items-center justify-between font-bold ' + (ok ? 'bg-emerald-50 text-emerald-800' : diff === 0 ? 'bg-slate-100 text-slate-600' : 'bg-red-50 text-red-700')}>
            <span className="text-[13px]">{ok ? 'Tally matches' : diff > 0 ? 'Short by' : diff < 0 ? 'Excess of' : 'Enter handover to check'}</span>
            <span className="font-display text-lg">{diff === 0 ? '✓' : inr(Math.abs(diff))}</span>
          </div>
          <input className={inp + ' mt-3'} placeholder="Note (optional)" value={f.note} onChange={(e) => setF((p) => ({ ...p, note: e.target.value }))} />
          <div className="mt-3"><PrimaryBtn testid="dc-save-recon" onClick={save}>Save day close</PrimaryBtn></div>
        </div>
      </Section>
    </>
  )
}

const L = ({ k, v, tone = 'text-slate-900', bold }) => <div className="flex justify-between px-3.5 py-2"><span className="text-slate-500">{k}</span><span className={(bold ? 'font-bold ' : 'font-semibold ') + tone}>{v}</span></div>
