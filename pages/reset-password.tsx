import { useState } from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { LockOutlined, MailOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/store/authStore'

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const user = useAuthStore((state) => state.user)

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user?.email || '',
          oldPassword: values.oldPassword,
          newPassword: values.newPassword,
          confirmPassword: values.confirmPassword
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        message.success(data.message)
        setTimeout(() => {
          useAuthStore.getState().logout()
          window.location.href = '/login'
        }, 1500)
      } else {
        message.error(data.message || '密码重置失败')
      }
    } catch {
      message.error('密码重置失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400 }} title={<div style={{ textAlign: 'center' }}><LockOutlined /> 重置密码</div>}>
        <p style={{ color: '#ff4d4f', marginBottom: 16, textAlign: 'center' }}>
          您的密码为初始密码，请立即修改
        </p>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item label="邮箱">
            <Input disabled prefix={<MailOutlined />} value={user?.email || ''} />
          </Form.Item>
          <Form.Item
            name="oldPassword"
            label="旧密码"
            rules={[
              { required: true, message: '请输入旧密码' }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入旧密码" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度至少为6位' }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认密码"
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                }
              })
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请确认新密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%' }}>
              确认修改
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}