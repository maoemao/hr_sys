import React from 'react'
import { Button, Layout as AntLayout, Menu, Avatar, Dropdown, message } from 'antd'
import { LogoutOutlined, UserOutlined, MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/router'
import axios from '@/lib/axios'

interface LayoutProps {
  children: React.ReactNode
}

const { Header, Sider, Content } = AntLayout

export default function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const logout = useAuthStore((state) => state.logout)
  const refreshToken = useAuthStore((state) => state.refreshToken)
  const user = useAuthStore((state) => state.user)
  const router = useRouter()

  const handleLogout = async () => {
    if (logoutLoading) return
    
    console.log('Starting logout process...')
    console.log('Refresh token:', refreshToken ? 'exists' : 'not found')
    
    setLogoutLoading(true)
    try {
      console.log('Calling logout API...')
      await axios.post('/auth/logout', { refreshToken })
      console.log('Logout API response received')
      message.success('已退出登录')
    } catch (error: any) {
      console.error('Logout error:', error)
      message.error('退出登录失败')
    } finally {
      console.log('Clearing local state...')
      logout()
      setLogoutLoading(false)
      window.location.href = '/login'
    }
  }

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: logoutLoading ? '退出中...' : '退出登录',
      onClick: handleLogout,
      disabled: logoutLoading
    }
  ]

  const sideMenuItems = [
    { key: 'entry_list', label: '员工列表' },
    { key: 'import_errors', label: '导入错误' }
  ]

  const handleMenuClick = (e: { key: string }) => {
    router.push(`/${e.key}`)
  }

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="logo" style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: collapsed ? 20 : 18,
          fontWeight: 'bold',
          color: '#fff'
        }}>
          {collapsed ? 'HR' : '人力资源系统'}
        </div>
        <Menu
          mode="inline"
          defaultSelectedKeys={[router.pathname.replace('/', '')]}
          items={sideMenuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <AntLayout>
        <Header style={{
          padding: 0,
          background: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%', padding: '0 24px' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16, width: 64, height: 64 }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 14, color: '#666' }}>欢迎，{user?.name}</span>
              <Dropdown menu={{ items: userMenuItems }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  padding: '8px'
                }}>
                  <Avatar icon={<UserOutlined />} />
                </div>
              </Dropdown>
            </div>
          </div>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: '#fff', minHeight: 280 }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  )
}