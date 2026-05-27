import { useState } from 'react'
import { Menu, Layout, message } from 'antd'
import {
  UserAddOutlined,
  WarningOutlined,
  LogoutOutlined,
  SafetyOutlined,
  UserOutlined
} from '@ant-design/icons'
import { useRouter } from 'next/router'
import { useAuthStore } from '@/store/authStore'
import axios from '@/lib/axios'

const { Sider } = Layout

export default function Sidebar() {
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const logout = useAuthStore((state) => state.logout)
  const refreshToken = useAuthStore((state) => state.refreshToken)
  const isSuperAdmin = useAuthStore((state) => state.isSuperAdmin)
  const user = useAuthStore((state) => state.user)

  const menuItems = [
    {
      key: '/entry_list',
      icon: <UserAddOutlined />,
      label: '入职名单',
    },
    {
      key: '/import_errors',
      icon: <WarningOutlined />,
      label: '导入错误日志',
    },
  ]

  if (isSuperAdmin()) {
    menuItems.push({
      key: '/admin/users',
      icon: <SafetyOutlined />,
      label: '权限管理',
    })
  }

  const handleMenuClick = ({ key }: { key: string }) => {
    router.push(key)
  }

  const handleLogout = async () => {
    if (logoutLoading) return

    setLogoutLoading(true)
    try {
      await axios.post('/auth/logout', { refreshToken })
    } catch (error: any) {
      console.error('Logout error:', error)
    } finally {
      logout()
      setLogoutLoading(false)
      message.success('已退出登录', 2)
      setTimeout(() => {
        window.location.href = '/login'
      }, 200)
    }
  }

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      style={{
        height: '100vh',
        position: 'sticky',
        top: 0,
        left: 0,
        overflow: 'auto',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: collapsed ? 16 : 18,
            fontWeight: 'bold',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          HR管理系统
        </div>

        {!collapsed && user && (
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <UserOutlined style={{ color: '#1890ff', fontSize: 16 }} />
              <span style={{ color: 'white', fontSize: 14, fontWeight: 500 }}>
                {user.name}
              </span>
            </div>
            <div
              style={{
                color: 'rgba(255,255,255,0.45)',
                fontSize: 12,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={user.email}
            >
              {user.email}
            </div>
          </div>
        )}

        {collapsed && (
          <div
            style={{
              padding: '12px 8px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <UserOutlined style={{ color: '#1890ff', fontSize: 18 }} />
          </div>
        )}

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[router.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ flex: 1 }}
        />
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            padding: '16px',
          }}
        >
          <div
            onClick={handleLogout}
            style={{
              color: 'rgba(255,255,255,0.65)',
              cursor: logoutLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 6,
              transition: 'all 0.3s',
              opacity: logoutLoading ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!logoutLoading) {
                e.currentTarget.style.color = 'white'
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
              }
            }}
            onMouseLeave={(e) => {
              if (!logoutLoading) {
                e.currentTarget.style.color = 'rgba(255,255,255,0.65)'
                e.currentTarget.style.background = 'transparent'
              }
            }}
          >
            <LogoutOutlined />
            {!collapsed && (logoutLoading ? '退出中...' : '退出登录')}
          </div>
        </div>
      </div>
    </Sider>
  )
}