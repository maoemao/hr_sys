import { useState } from 'react'
import { Menu, Layout } from 'antd'
import {
  UserAddOutlined,
  WarningOutlined,
  LogoutOutlined
} from '@ant-design/icons'
import { useRouter } from 'next/router'

const { Sider } = Layout

export default function Sidebar() {
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

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

  const handleMenuClick = ({ key }: { key: string }) => {
    router.push(key)
  }

  const handleLogout = () => {
    router.push('/login')
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
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 6,
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'white'
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.65)'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <LogoutOutlined />
            {!collapsed && '退出登录'}
          </div>
        </div>
      </div>
    </Sider>
  )
}