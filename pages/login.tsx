import { useState } from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { LockOutlined, MailOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/store/authStore'
import axios from '@/lib/axios'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((state) => state.login)

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true)
    try {
      const response = await axios.post('/auth/login', values)
      const { accessToken, refreshToken, user, needResetPassword } = response.data

      login(accessToken, refreshToken, user)
      message.success('登录成功')

      setTimeout(() => {
        if (needResetPassword) {
          window.location.href = '/reset-password'
        } else {
          window.location.href = '/entry_list'
        }
      }, 200)
    } catch (error: any) {
      const errorMessage = error.response?.data?.message ||
                          error.message ||
                          '登录失败，请稍后重试'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f0f2f5'
    }}>
      <Card
        title={<div style={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold' }}>人力资源系统</div>}
        style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
      >
        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          initialValues={{
            email: '',
            password: ''
          }}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="请输入邮箱"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}