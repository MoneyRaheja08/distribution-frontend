import { createContext, useContext, useState } from 'react'
import { api, setToken, setCompany } from '../api/client.js'
import { _setMe } from '../api/mock.js'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

const STORE_KEY = 'ashoka_auth'
const COMPANY_KEY = 'ashoka_company'

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY)
      if (raw) {
        const a = JSON.parse(raw)
        setToken(a.token)
        _setMe(a.user.id, a.user.name, a.user.role)
        return a
      }
    } catch { /* ignore */ }
    return null
  })
  const [company, setCompanyState] = useState(() => {
    try { const raw = localStorage.getItem(COMPANY_KEY); if (raw) { const c = JSON.parse(raw); setCompany(c.id); return c } } catch { /* ignore */ }
    return null
  })
  const selectCompany = (c) => {
    if (c) { setCompany(c.id); localStorage.setItem(COMPANY_KEY, JSON.stringify(c)) }
    else { setCompany(null); localStorage.removeItem(COMPANY_KEY) }
    setCompanyState(c)
  }

  const login = async (name, pin) => {
    const r = await api.login(name, pin)
    const a = { token: r.access_token, user: r.user }
    setToken(a.token)
    _setMe(a.user.id, a.user.name, a.user.role)
    localStorage.setItem(STORE_KEY, JSON.stringify(a))
    setAuth(a)
    return a
  }

  const logout = () => {
    setToken(null)
    setCompany(null)
    localStorage.removeItem(STORE_KEY)
    localStorage.removeItem(COMPANY_KEY)
    setAuth(null)
    setCompanyState(null)
  }

  return <AuthCtx.Provider value={{ auth, company, selectCompany, login, logout }}>{children}</AuthCtx.Provider>
}
