import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.jsx'
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
  return (
    <Routes>
      <Route path="/" element={<DcHome />} />
      <Route path="/collections" element={<Bills />} />
      <Route path="/pending" element={<Pending />} />
      <Route path="/expenses" element={<Expenses />} />
      <Route path="/cash" element={<Cash />} />
      <Route path="/exchanges" element={<Exchanges />} />
      <Route path="/dayclose" element={<DayClose />} />
      <Route path="/reports" element={<DcReports />} />
      <Route path="/more" element={<More />} />
      <Route path="/calendar" element={<Calendar />} />
      {admin && <Route path="/users" element={<Users />} />}
      {admin && <Route path="/verify" element={<Verify />} />}
      {seesAll && <Route path="/reconcile" element={<Reconcile />} />}
      <Route path="/m/:name" element={<CrudModule />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
