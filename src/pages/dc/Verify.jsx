import { useEffect, useState } from 'react'
import { Check, X, Receipt, Repeat } from 'lucide-react'
import { api } from '../../api/client.js'
import { toast } from '../../lib/toast.js'
import { inr } from '../../lib/format.js'
import { Spin } from '../../components/ui.jsx'
import { Hero, ListCard, Row, Chip, PageHead, Section } from './bits.jsx'

export default function Verify() {
  const [data, setData] = useState(null)
  const load = () => api.dcApprovals().then(setData)
  useEffect(() => { load() }, [])
  if (!data) return <Spin />
  const actExp = async (id, ok) => { await api.dcApproveExpense(id, ok); toast.success(ok ? 'Expense verified' : 'Expense rejected'); load() }
  const actRes = async (id, ok) => { await api.dcApproveResale(id, ok); toast.success(ok ? 'Resale verified' : 'Resale rejected'); load() }
  const Acts = ({ onOk, onNo }) => (
    <div className="flex gap-1.5">
      <button data-testid="dc-verify-ok" onClick={onOk} className="flex items-center gap-1 text-[12px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg px-3 py-1.5 transition-colors"><Check size={13} />Verify</button>
      <button data-testid="dc-verify-no" onClick={onNo} className="flex items-center gap-1 text-[12px] font-bold text-rose-600 border border-rose-200 hover:bg-rose-50 rounded-lg px-2.5 py-1.5 transition-colors"><X size={13} />Reject</button>
    </div>
  )
  return (
    <>
      <PageHead title="Verify" sub="Approve before it affects the numbers" />
      <Hero eyebrow="Waiting for you" value={String(data.count)} sub={(data.expenses.length) + ' expenses · ' + (data.resales.length) + ' resales'} testid="dc-verify-hero" />
      <Section title="Big expenses (over ₹1,000)">
        <ListCard empty="No expenses waiting." testid="dc-verify-exp">
          {data.expenses.map((e) => (
            <Row key={e.id} testid={'dc-verify-exp-' + e.id} title={e.category || 'Expense'} sub={[e.staff, e.date, e.note].filter(Boolean).join(' · ')} tone="bg-rose-500"
              right={<div className="flex items-center gap-2"><div className="text-[14px] font-bold text-rose-700">{inr(e.amount)}</div></div>}>
              <div className="mt-2"><Acts onOk={() => actExp(e.id, true)} onNo={() => actExp(e.id, false)} /></div>
            </Row>
          ))}
        </ListCard>
      </Section>
      <Section title="Exchange resales">
        <ListCard empty="No resales waiting." testid="dc-verify-res">
          {data.resales.map((r) => (
            <Row key={r.id} testid={'dc-verify-res-' + r.id} title={(r.brand ? r.brand + ' ' : '') + (r.model || 'Item')} sub={[r.staff, r.customer].filter(Boolean).join(' · ')} tone="bg-fuchsia-500"
              right={<div className="text-right"><div className="text-[14px] font-bold text-emerald-700">+{inr(r.amount)}</div><Chip tone="text-slate-500 bg-slate-100 ring-slate-200">{r.mode}</Chip></div>}>
              <div className="mt-2"><Acts onOk={() => actRes(r.id, true)} onNo={() => actRes(r.id, false)} /></div>
            </Row>
          ))}
        </ListCard>
      </Section>
    </>
  )
}
