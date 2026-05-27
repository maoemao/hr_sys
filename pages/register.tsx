import { useState } from 'react'
import { useRouter } from 'next/router'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined, UserAddOutlined } from '@ant-design/icons'
import axios from '@/lib/axios'

export default function Register() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const onFinish = async (values: { email: string; password: string; name: string }) => {
    setLoading(true)
    try {
      await axios.post('/auth/register', values)
      message.success('注册成功，请登录')
      router.push('/login')
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          '注册失败，请稍后重试'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = () => {
    router.push('/login')
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
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <UserAddOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          <h2 style={{ marginTop: 10 }}>用户注册</h2>
        </div>
        <Form
          name="register"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="name"
            rules={[
              { required: true, message: '请输入姓名' },
              { min: 2, message: '姓名长度不能少于2位' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入姓名"
            />
          </Form.Item>

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
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码长度不能少于6位' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                }
              })
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请确认密码"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              注册
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button type="link" onClick={handleLogin}>
            已有账号？立即登录
          </Button>
        </div>
      </Card>
    </div>
  )
}