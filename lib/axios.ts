import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const baseURL = '/api'

const axiosInstance = axios.create({
  baseURL,
  timeout: 10000,
  withCredentials: true,
})

axiosInstance.interceptors.request.use(
  (config) => {
    // 如果是 logout 请求，跳过添加 Authorization header
    if (config.url?.includes('/auth/logout')) {
      return config
    }
    
    const accessToken = useAuthStore.getState().accessToken
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

let isRefreshing = false
let failedQueue: { resolve: (token: string) => void; reject: (error: unknown) => void }[] = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token!)
    }
  })
  failedQueue = []
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // 如果是 logout 请求，直接返回错误，不尝试刷新 token
    if (originalRequest?.url?.includes('/auth/logout')) {
      return Promise.reject(error)
    }
    
    const authStore = useAuthStore.getState()

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return axiosInstance(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const response = await axios.post(`${baseURL}/auth/refresh`, {
          refreshToken: authStore.refreshToken
        })

        const { accessToken, refreshToken: newRefreshToken } = response.data
        
        useAuthStore.getState().refreshAccessToken(accessToken)
        
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken)
          useAuthStore.getState().login(accessToken, newRefreshToken, authStore.user!)
        }

        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        processQueue(null, accessToken)
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError)
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance