import { create } from 'zustand'
import { jwtDecode } from 'jwt-decode'

export type UserRole = 'super_admin' | 'admin' | 'user'

interface User {
  id: number
  email: string
  name: string
  role: UserRole
}

interface AuthStore {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  isLoggedIn: boolean
  login: (accessToken: string, refreshToken: string, user: User) => void
  logout: () => void
  refreshAccessToken: (newAccessToken: string, newRefreshToken?: string) => void
  getTokenExpiry: () => number | null
  restoreAuth: () => void
  isSuperAdmin: () => boolean
  canExport: () => boolean
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const nameEQ = name + '='
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isLoggedIn: false,

  restoreAuth: () => {
    if (typeof window === 'undefined') return
    
    try {
      const accessToken = localStorage.getItem('accessToken')
      const refreshToken = localStorage.getItem('refreshToken')
      const userStr = localStorage.getItem('user')
      const user = userStr ? JSON.parse(userStr) : null
      
      console.log('Restoring auth state:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        hasUser: !!user,
        hasCookieToken: !!getCookie('accessToken')
      })
      
      if (accessToken && user) {
        set({
          accessToken,
          refreshToken,
          user,
          isLoggedIn: true
        })
        console.log('Auth state restored successfully')
      } else {
        console.log('No valid auth state found')
      }
    } catch (error) {
      console.error('Failed to restore auth state:', error)
    }
  },

  login: (accessToken, refreshToken, user) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('user', JSON.stringify(user))
    
    setCookie('accessToken', accessToken, 1)
    setCookie('refreshToken', refreshToken, 7)
    
    set({ accessToken, refreshToken, user, isLoggedIn: true })
  },

  logout: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    
    deleteCookie('accessToken')
    deleteCookie('refreshToken')
    
    set({ accessToken: null, refreshToken: null, user: null, isLoggedIn: false })
  },

  refreshAccessToken: (newAccessToken, newRefreshToken) => {
    localStorage.setItem('accessToken', newAccessToken)
    setCookie('accessToken', newAccessToken, 1)
    
    if (newRefreshToken) {
      localStorage.setItem('refreshToken', newRefreshToken)
      setCookie('refreshToken', newRefreshToken, 7)
    }
    
    set({ accessToken: newAccessToken })
  },

  getTokenExpiry: () => {
    const { accessToken } = get()
    if (!accessToken) return null
    try {
      const decoded = jwtDecode<{ exp: number }>(accessToken)
      return decoded.exp * 1000
    } catch {
      return null
    }
  },

  isSuperAdmin: () => {
    const { user } = get()
    return user?.role === 'super_admin'
  },

  canExport: () => {
    const { user } = get()
    return user?.role === 'super_admin' || user?.role === 'admin'
  }
}))