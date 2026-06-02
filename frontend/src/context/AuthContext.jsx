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
      try { setUser(JSON.parse(savedUser)) } catch { /* ignore */ }
    }
    setLoading(false)
  }, [])

  async function login(username, password) {
    const data = await apiLogin(username, password)
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    const userInfo = { username }
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

  const isStaff = () => {
    // Decoded from token would be ideal; for now treat all logged-in as potential staff
    return !!user
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isStaff }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
