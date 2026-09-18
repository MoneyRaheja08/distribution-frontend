import { useEffect, useState } from 'react'
import { api } from '../../api/client.js'
import { toast } from '../../lib/toast.js'
import { inr } from '../../lib/format.js'
import { Spin, Modal } from '../../components/ui.jsx'
import { confirmDialog } from '../../lib/confirm.js'
import { Hero, ListCard, Row, Fab, PageHead, DateNav, Field, inp, PrimaryBtn, today, niceDate } from './bits.jsx'

const CATS = ['Tea & snacks', 'Transport', 'Salary advance', 'Electricity', 'Rent', 'Repairs', 'Stationery', 'Other']

export default function Expenses() {
  const [date, setDate] = useState(today())
  const [data, setData] = useState(null)
  const [adding, setAdding] = useState(false)
  const load = () => api.dcExpenses('?date=' + date).then(setData)
  useEffect(() => { setData(null); load() }, [date]) // eslint-disable-line
  const del = async (e) => { if (await confirmDialog('Delete this expense?', { danger: true })) { await api.dcDeleteExpense(e.id); load() } }
  return (
    <>
      <PageHead title="Expenses" sub={niceDate(date)} right={<DateNav date={date} setDate={setDate} testid="dc-exp-date" />} />
      {!data ? <Spin /> : (
        <>
          <Hero eyebrow="Spent" value={inr(data.total || 0)} sub={data.rows.length + ' entries'} />
          <div className="mt-4">
            <ListCard empty="No expenses recorded for this day." testid="dc-exp-list">
              {data.rows.map((e) => (
                <Row key={e.id} title={e.category || 'Expense'} sub={[e.paid_by && 'paid by ' + e.paid_by, e.note, e.staff].filter(Boolean).join(' · ')} tone="bg-rose-500" onDelete={() => del(e)}
                  right={<div className="text-[15px] font-bold text-rose-700">− {inr(e.amount)}</div>} />
              ))}
            </ListCard>
          </div>
        </>
      )}
      <Fab label="Add expense" testid="dc-fab-exp" onClick={() => setAdding(true)} />
      {adding && <ExpenseForm date={date} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); load() }} />}
    </>
  )
}

function ExpenseForm({ date, onClose, onSaved }) {
  const [f, setF] = useState({ category: '', amount: '', paid_by: '', note: '' })
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))
  const save = async () => {
    if (!(+f.amount > 0)) return toast.error('Enter amount')
    setBusy(true)
    try { await api.dcCreateExpense({ date, category: f.category || 'Other', amount: +f.amount, paid_by: f.paid_by, note: f.note }); toast.success('Expense added'); onSaved() }
    catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }
  return (
    <Modal title="Add expense" onClose={onClose}>
      <Field label="Amount"><input data-testid="dc-exp-amt" autoFocus className={inp + ' text-2xl font-display font-bold py-3'} type="number" inputMode="decimal" placeholder="₹ 0" value={f.amount} onChange={(e) => set('amount', e.target.value)} /></Field>
      <div className="text-[12px] font-semibold text-slate-600 mt-4 mb-1.5">Category</div>
      <div className="flex flex-wrap gap-1.5">
        {CATS.map((c) => <button key={c} onClick={() => set('category', c)} className={'text-[12px] font-semibold rounded-full px-3 py-1.5 border transition-colors ' + (f.category === c ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200')}>{c}</button>)}
      </div>
      <input data-testid="dc-exp-cat" className={inp + ' mt-2'} placeholder="or type a category" value={f.category} onChange={(e) => set('category', e.target.value)} />
      <div className="grid grid-cols-2 gap-3 mt-4">
        <Field label="Paid by"><input className={inp} placeholder="Name" value={f.paid_by} onChange={(e) => set('paid_by', e.target.value)} /></Field>
        <Field label="Note"><input className={inp} placeholder="optional" value={f.note} onChange={(e) => set('note', e.target.value)} /></Field>
      </div>
      <div className="mt-5"><PrimaryBtn testid="dc-add-exp" onClick={save} disabled={busy}>Save expense</PrimaryBtn></div>
    </Modal>
  )
}
