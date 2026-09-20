import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.jsx'
import { api } from '../../api/client.js'
import { Spin } from '../../components/ui.jsx'
import DcHome from './DcHome.jsx'
import Bills from './Bills.jsx'
import Pending from './Pending.jsx'
import Expenses from './Expenses.jsx'
import DayClose from './DayClose.jsx'
import DcReports from './DcReports.jsx'
import More from './More.jsx'
import Calendar from './Calendar.jsx'
import CrudModule from './CrudModule.jsx'
import Users from './Users.jsx'
import Cash from './Cash.jsx'
import Exchanges from './Exchanges.jsx'
import Verify from './Verify.jsx'
import Reconcile from './Reconcile.jsx'

export default function DcHub() {
  const { auth } = useAuth()
  const admin = auth.user.role === 'admin'
  const seesAll = ['admin', 'manager'].includes(auth.user.role)
  const [perms, setPerms] = useState(admin ? {} : null)
  useEffect(() => { if (!admin) api.dcMyPerms().then((r) => setPerms(r.perms || {})).catch(() => setPerms({})) }, [admin])
  if (perms === null) return <Spin />
  const can = (k) => admin || perms[k] !== false
  return (
    <Routes>
      <Route path="/" element={<DcHome />} />
      {can('collections') && <Route path="/collections" element={<Bills />} />}
      {can('pending') && <Route path="/pending" element={<Pending />} />}
      {can('expenses') && <Route path="/expenses" element={<Expenses />} />}
      {can('cash') && <Route path="/cash" element={<Cash />} />}
      {can('exchange') && <Route path="/exchanges" element={<Exchanges />} />}
      {can('dayclose') && <Route path="/dayclose" element={<DayClose />} />}
      {can('reports') && <Route path="/reports" element={<DcReports />} />}
      <Route path="/more" element={<More />} />
      <Route path="/calendar" element={admin ? <Calendar /> : <Navigate to="/" replace />} />
      {admin && <Route path="/users" element={<Users />} />}
      {admin && <Route path="/verify" element={<Verify />} />}
      {seesAll && <Route path="/reconcile" element={<Reconcile />} />}
      <Route path="/m/:name" element={<CrudModule />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
