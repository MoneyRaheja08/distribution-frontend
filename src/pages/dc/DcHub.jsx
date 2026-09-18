import { Routes, Route, Navigate } from 'react-router-dom'
import DcHome from './DcHome.jsx'
import Bills from './Bills.jsx'
import Pending from './Pending.jsx'
import Expenses from './Expenses.jsx'
import DayClose from './DayClose.jsx'
import DcReports from './DcReports.jsx'
import More from './More.jsx'
import Calendar from './Calendar.jsx'
import CrudModule from './CrudModule.jsx'

export default function DcHub() {
  return (
    <Routes>
      <Route path="/" element={<DcHome />} />
      <Route path="/collections" element={<Bills />} />
      <Route path="/pending" element={<Pending />} />
      <Route path="/expenses" element={<Expenses />} />
      <Route path="/dayclose" element={<DayClose />} />
      <Route path="/reports" element={<DcReports />} />
      <Route path="/more" element={<More />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/m/:name" element={<CrudModule />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
