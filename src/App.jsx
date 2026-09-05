import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './auth/AuthContext.jsx'
import Shell from './components/Shell.jsx'
import Login from './pages/Login.jsx'

import Beat from './pages/collector/Beat.jsx'
import Dealer from './pages/collector/Dealer.jsx'
import Collect from './pages/collector/Collect.jsx'
import MyDay from './pages/collector/MyDay.jsx'
import StockView from './pages/collector/StockView.jsx'

import Dashboard from './pages/staff/Dashboard.jsx'
import Dealers from './pages/staff/Dealers.jsx'
import Stock from './pages/staff/Stock.jsx'
import Money from './pages/staff/Money.jsx'
import Users from './pages/staff/Users.jsx'
import Approvals from './pages/staff/Approvals.jsx'
import Reconcile from './pages/staff/Reconcile.jsx'
import Prices from './pages/Prices.jsx'

export default function App() {
  const { auth } = useAuth()

  if (!auth) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    )
  }

  const role = auth.user.role

  return (
    <Routes>
      <Route element={<Shell />}>
        {role === 'collector' ? (
          <>
            <Route path="/" element={<Beat />} />
            <Route path="/dealer/:id" element={<Dealer />} />
            <Route path="/collect/:id" element={<Collect />} />
            <Route path="/stock" element={<StockView />} />
            <Route path="/myday" element={<MyDay />} />
            <Route path="/prices" element={<Prices />} />
          </>
        ) : (
          <>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dealers" element={<Dealers />} />
            <Route path="/stock" element={<Stock />} />
            {role === 'admin' && <Route path="/money" element={<Money />} />}
            {role === 'admin' && <Route path="/reconcile" element={<Reconcile />} />}
            <Route path="/prices" element={<Prices />} />
            <Route path="/approvals" element={<Approvals />} />
            {role === 'admin' && <Route path="/users" element={<Users />} />}
          </>
        )}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
