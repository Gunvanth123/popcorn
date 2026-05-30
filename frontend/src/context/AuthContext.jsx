import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    const token = localStorage.getItem('popcorn_token')
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const data = await authApi.getMe()
      setUser(data)
    } catch (err) {
      console.error('Failed to load user session:', err)
      localStorage.removeItem('popcorn_token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    setLoading(true)
    try {
      const data = await authApi.login({ email, password })
      localStorage.setItem('popcorn_token', data.access_token)
      await fetchUser()
      return true
    } catch (err) {
      setLoading(false)
      throw err
    }
  }

  const register = async (name, email, password) => {
    setLoading(true)
    try {
      await authApi.register({ name, email, password })
      const data = await authApi.login({ email, password })
      localStorage.setItem('popcorn_token', data.access_token)
      await fetchUser()
      return true
    } catch (err) {
      setLoading(false)
      throw err
    }
  }

  const logout = () => {
    localStorage.removeItem('popcorn_token')
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser: fetchUser
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
