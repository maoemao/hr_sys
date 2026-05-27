import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Popconfirm, Space, Card } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, LockOutlined } from '@ant-design/icons'
import axios from '@/lib/axios'
import type { UserRole } from '@/store/authStore'
import Sidebar from '../../components/Sidebar'

const { Option } = Select

interface User {
  id: number
  email: string
  name: string
  role: UserRole
  created_at: string
}

const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'super_admin', label: '超级管理员' },
  { value: 'admin', label: '管理员' },
  { value: 'user', label: '普通用户' }
]

const createRoleOptions: { value: UserRole; label: string }[] = [
  { value: 'admin', label: '管理员' },
  { value: 'user', label: '普通用户' }
]

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/auth/users')
      setUsers(response.data)
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  const showAddModal = () => {
    setEditingUser(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const showEditModal = (user: User) => {
    setEditingUser(user)
    form.setFieldsValue({
      email: user.email,
      name: user.name,
      role: user.role
    })
    setIsModalVisible(true)
  }

  const handleDelete = async (userId: number) => {
    try {
      await axios.delete('/auth/users', { data: { userId } })
      message.success('删除成功')
      fetchUsers()
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败')
    }
  }

  const handleResetPassword = async (userId: number, userName: string) => {
    try {
      await axios.post('/auth/admin-reset-password', { userId })
      message.success(`已将 ${userName} 的密码重置为 123456`)
    } catch (error: any) {
      message.error(error.response?.data?.message || '密码重置失败')
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      if (editingUser) {
        await axios.put('/auth/users', {
          userId: editingUser.id,
          role: values.role
        })
        message.success('更新成功')
      } else {
        await axios.post('/auth/users', values)
        message.success('创建成功')
      }

      setIsModalVisible(false)
      form.resetFields()
      fetchUsers()
    } catch (error: any) {
      message.error(error.response?.data?.message || error.message || '操作失败')
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: UserRole) => {
        const option = roleOptions.find(r => r.value === role)
        return option?.label || role
      }
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: User) => {
        const isReadOnly = record.email === 'admin@qq.com'
        return (
          <Space>
            <Button
              type="primary"
              ghost
              icon={<EditOutlined />}
              onClick={() => showEditModal(record)}
            >
              编辑角色
            </Button>
            {!isReadOnly && (
              <>
                <Popconfirm
                  title={`确定将 ${record.name} 的密码重置为 123456 吗？`}
                  onConfirm={() => handleResetPassword(record.id, record.name)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button icon={<LockOutlined />}>
                    重置密码
                  </Button>
                </Popconfirm>
                <Popconfirm
                  title="确定删除该用户吗？"
                  onConfirm={() => handleDelete(record.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>
              </>
            )}
            {isReadOnly && (
              <span style={{ color: '#999', marginLeft: 8 }}>只读账号</span>
            )}
          </Space>
        )
      }
    }
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: 24, background: '#f0f2f5', overflow: 'auto' }}>
        <Card
          title={<div><UserOutlined /> 用户管理</div>}
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
              创建用户
            </Button>
          }
        >
          <Table
            dataSource={users}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>

        <Modal
          title={editingUser ? '编辑用户' : '创建用户'}
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false)
            form.resetFields()
          }}
          footer={null}
          width={500}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            {!editingUser && (
              <>
                <Form.Item
                  name="email"
                  label="邮箱"
                  rules={[
                    { required: true, message: '请输入邮箱' },
                    { type: 'email', message: '请输入正确的邮箱格式' }
                  ]}
                >
                  <Input placeholder="请输入邮箱" />
                </Form.Item>
                <Form.Item
                  name="password"
                  label="密码"
                  rules={[{ required: true, message: '请输入密码' }]}
                >
                  <Input.Password placeholder="请输入密码" />
                </Form.Item>
              </>
            )}
            {editingUser && (
              <Form.Item label="邮箱">
                <Input disabled value={editingUser.email} />
              </Form.Item>
            )}
            <Form.Item
              name="name"
              label="姓名"
              rules={[{ required: true, message: '请输入姓名' }]}
            >
              <Input placeholder="请输入姓名" />
            </Form.Item>
            <Form.Item
              name="role"
              label="角色"
              rules={[{ required: true, message: '请选择角色' }]}
            >
              <Select placeholder="请选择角色">
                {(editingUser ? roleOptions : createRoleOptions).map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => {
                  setIsModalVisible(false)
                  form.resetFields()
                }}>
                  取消
                </Button>
                <Button type="primary" htmlType="submit">
                  {editingUser ? '保存修改' : '创建用户'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  )
}