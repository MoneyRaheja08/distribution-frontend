import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Phone, MapPin, Check } from 'lucide-react'
import { api } from '../../api/client.js'
import { outstanding } from '../../lib/format.js'
import { Spin, BackBtn } from '../../components/ui.jsx'
import { LedgerHeader, LedgerTable } from '../../components/Ledger.jsx'
import { waLink, reminderText } from '../../lib/whatsapp.js'
import { getPosition } from '../../lib/geo.js'

export default function Dealer() {
  const { id } = useParams()
  const nav = useNavigate()
  const [d, setD] = useState(null)
  const [led, setLed] = useState(null)
  const [visited, setVisited] = useState(false)
  const [marking, setMarking] = useState(false)

  useEffect(() => {
    api.dealer(id).then((x) => { setD(x); setVisited(x.visited_today) })
    api.dealerLedger(id).then(setLed)
  }, [id])
  if (!d) return <Spin />

  const o = led ? led.outstanding : outstanding(d)

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <BackBtn label="Beat" />
        <div className="flex gap-2">
          <button disabled={marking} onClick={async () => { if (!visited) { setMarking(true); const loc = await getPosition(); await api.markVisited(d.id, loc || {}); setVisited(true); setMarking(false) } }}
            className={'text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1 disabled:opacity-70 ' + (visited ? 'bg-slate-100 text-slate-500' : 'bg-slate-900 text-white')}>
            {visited ? <><Check size={13} />Visited</> : marking ? <><MapPin size={13} />Locating…</> : <><MapPin size={13} />Mark visited</>}
          </button>
          <a href={'tel:' + (d.phone || '')} className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg flex items-center gap-1">
            <Phone size={13} />Call
          </a>
        </div>
      </div>

      <LedgerHeader name={d.name} outstanding={o} ageing={led ? led.ageing : d.ageing}
        creditLimit={d.credit_limit} lastPayment={led ? led.last_payment : d.last_payment} />

      <div className="text-xs font-bold text-slate-600 mb-2 px-0.5">Ledger \u00b7 oldest first</div>
      {!led ? <Spin /> : <LedgerTable entries={led.entries} />}

      {o > 0 && (
        <div className="flex gap-2 mt-3">
          <button onClick={() => nav('/collect/' + d.id)} className="flex-1 bg-emerald-700 text-white font-semibold py-3.5 rounded-xl">
            Record collection
          </button>
          {d.phone && <a href={waLink(d.phone, reminderText(d.name, o, led ? led.ageing : d.ageing))} target="_blank" rel="noreferrer" className="flex-1 text-center bg-[#25D366] text-white font-semibold py-3.5 rounded-xl">WhatsApp</a>}
        </div>
      )}
    </>
  )
}
