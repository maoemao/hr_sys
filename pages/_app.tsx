import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { QueryClientProvider } from '@tanstack/react-query'
import queryClient from '@/lib/queryClient'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

export default function App({ Component, pageProps }: AppProps) {
  const restoreAuth = useAuthStore((state) => state.restoreAuth)
  
  useEffect(() => {
    // 在客户端初始化时恢复认证状态
    restoreAuth()
  }, [restoreAuth])
  
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={zhCN}>
        <Component {...pageProps} />
      </ConfigProvider>
    </QueryClientProvider>
  )
}