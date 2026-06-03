import { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin } from '../api/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const savedUser = localStorage.getItem('user_info')
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem('user_info')
      }
    }
    setLoading(false)
  }, [])

  async function login(username, password) {
    const data = await apiLogin(username, password)
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)

    // Fetch user info from /api/me/ to get is_staff
    const meRes = await fetch('/api/me/', {
      headers: { Authorization: `Bearer ${data.access}` }
    })
    let userInfo = { username }
    if (meRes.ok) {
      const meData = await meRes.json()
      userInfo = {
        id: meData.id,
        username: meData.username,
        email: meData.email,
        is_staff: meData.is_staff,
        is_superuser: meData.is_superuser,
      }
    }
    localStorage.setItem('user_info', JSON.stringify(userInfo))
    setUser(userInfo)
    return data
  }

  function logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_info')
    setUser(null)
  }

  // Retorna true se o usuário pode escrever (staff ou superuser)
  const canWrite = () => !!(user && (user.is_staff || user.is_superuser))

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, canWrite }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
