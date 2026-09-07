import { createContext, useContext, useState, useEffect } from 'react'
import { api, setToken, setCompany } from '../api/client.js'
import { _setMe } from '../api/mock.js'
import { toast } from '../lib/toast.js'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

const STORE_KEY = 'ashoka_auth'
const COMPANY_KEY = 'ashoka_company'
const IDLE_MS = 5 * 60 * 1000  // auto-logout after 5 minutes idle

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

  // Refresh the logged-in user's permissions when the app opens (so toggles apply without re-login)
  useEffect(() => {
    if (!auth) return
    api.me().then((r) => {
      if (r && r.user) {
        const a = { ...auth, user: r.user }
        setAuth(a); localStorage.setItem(STORE_KEY, JSON.stringify(a)); _setMe(r.user.id, r.user.name, r.user.role)
      }
    }).catch(() => { /* offline: keep cached */ })
  }, [])   // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!auth) return
    let last = Date.now()
    const mark = () => { last = Date.now() }
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click', 'mousemove']
    events.forEach((e) => window.addEventListener(e, mark, { passive: true }))
    const iv = setInterval(() => {
      if (Date.now() - last > IDLE_MS) {
        clearInterval(iv)
        events.forEach((e) => window.removeEventListener(e, mark))
        toast.info('Logged out due to inactivity')
        logout()
      }
    }, 15000)
    return () => { clearInterval(iv); events.forEach((e) => window.removeEventListener(e, mark)) }
  }, [auth])   // eslint-disable-line react-hooks/exhaustive-deps

  return <AuthCtx.Provider value={{ auth, company, selectCompany, login, logout }}>{children}</AuthCtx.Provider>
}
