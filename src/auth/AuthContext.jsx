import { createContext, useContext, useState } from 'react'
import { api, setToken } from '../api/client.js'
import { _setMe } from '../api/mock.js'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

const STORE_KEY = 'ashoka_auth'

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
    localStorage.removeItem(STORE_KEY)
    setAuth(null)
  }

  return <AuthCtx.Provider value={{ auth, login, logout }}>{children}</AuthCtx.Provider>
}
