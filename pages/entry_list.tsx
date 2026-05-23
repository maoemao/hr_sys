import { useState, useEffect, useRef } from 'react'
import { Table, Input, Button, Space, Card, Form, Modal, message, Upload } from 'antd'
import { SearchOutlined, ReloadOutlined, PlusOutlined, EditOutlined, UploadOutlined, DownloadOutlined, FileExcelOutlined, DeleteOutlined } from '@ant-design/icons'
import Sidebar from '../components/Sidebar'
import { EntryList } from '../lib/db'

export default function EntryListPage() {
  const [entries, setEntries] = useState<EntryList[]>([])
  const [loading, setLoading] = useState(true)
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const [importLoading, setImportLoading] = useState(false)

  const [addModalVisible, setAddModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<EntryList | null>(null)
  const [deduplicateModalVisible, setDeduplicateModalVisible] = useState(false)
  const [pageSize, setPageSize] = useState(10)

  const searchFormRef = useRef<any>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async (values?: any) => {
    setLoading(true)
    let url = '/api/entry_list'
    if (values) {
      const params = new URLSearchParams()
      if (values.name) params.append('name', values.name)
      if (values.phone) params.append('phone', values.phone)
      if (values.idCard) params.append('idCard', values.idCard)
      if (params.toString()) {
        url = `/api/entry_list?${params.toString()}`
      }
    }
    const res = await fetch(url)
    const data = await res.json()
    setEntries(data)
    setLoading(false)
  }

  const handleSearch = (values: any) => {
    fetchData(values)
  }

  const handleReset = () => {
    form.resetFields()
    fetchData()
  }

  const handleAddUser = async (values: any) => {
    try {
      const res = await fetch('/api/entry_list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })
      if (res.ok) {
        message.success('添加成功')
        setAddModalVisible(false)
        form.resetFields()
        fetchData()
      } else {
        message.error('添加失败')
      }
    } catch {
      message.error('添加失败')
    }
  }

  const handleEditUser = async (values: any) => {
    if (!editingRecord) return
    try {
      const res = await fetch('/api/entry_list', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingRecord.id, ...values })
      })
      if (res.ok) {
        message.success('修改成功')
        setEditModalVisible(false)
        editForm.resetFields()
        setEditingRecord(null)
        fetchData()
      } else {
        message.error('修改失败')
      }
    } catch {
      message.error('修改失败')
    }
  }

  const openEditModal = (record: EntryList) => {
    setEditingRecord(record)
    editForm.setFieldsValue({
      部门: record.部门,
      岗位: record.岗位,
      联系电话: record.联系电话,
      银行卡号: record.银行卡号,
      备注: record.备注,
    })
    setEditModalVisible(true)
  }

  const handleExportTemplate = () => {
    window.open('/api/entry_list/template', '_blank')
  }

  const handleDeduplicate = () => {
    setDeduplicateModalVisible(true)
  }

  const handleConfirmDeduplicate = async () => {
    setDeduplicateModalVisible(false)
    try {
      const res = await fetch('/api/entry_list/deduplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (res.ok) {
        message.success(data.message)
        fetchData()
      } else {
        message.error(data.message || '去重失败')
      }
    } catch (error) {
      console.error('Deduplicate error:', error)
      message.error('去重失败')
    }
  }

  const handleExport = async () => {
    const values = searchFormRef.current?.getFieldsValue() || {}
    
    try {
      const res = await fetch('/api/entry_list/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })
      
      if (!res.ok) {
        message.error('导出失败')
        return
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `入职名单_${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      message.success('导出成功')
    } catch {
      message.error('导出失败')
    }
  }

  const handleImport = async (file: any) => {
    setImportLoading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('fileName', file.name)

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const base64 = (e.target?.result as string)?.split(',')[1] || ''
        
        const res = await fetch('/api/entry_list/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileContent: base64, fileName: file.name })
        })
        
        const data = await res.json()
        if (res.ok) {
          let msg = `${data.message}，成功: ${data.success}条`
          if (data.duplicated && data.duplicated > 0) {
            msg += `，重复跳过: ${data.duplicated}条`
          }
          if (data.failed && data.failed > 0) {
            msg += `，失败: ${data.failed}条`
          }
          if (data.errors && data.errors.length > 0) {
            msg += '\n详情:\n' + data.errors.join('\n')
          }
          message.success(msg)
          fetchData()
        } else {
          message.error(data.message || '导入失败')
        }
      } catch {
        message.error('导入失败')
      } finally {
        setImportLoading(false)
      }
    }
    reader.readAsDataURL(file)
    return false
  }

  const columns = [
    { title: '序号', dataIndex: '序号', key: '序号', width: 80 },
    { title: '部门', dataIndex: '部门', key: '部门', width: 100 },
    { title: '姓名', dataIndex: '姓名', key: '姓名', width: 100 },
    { title: '岗位', dataIndex: '岗位', key: '岗位', width: 100 },
    { title: '联系电话', dataIndex: '联系电话', key: '联系电话', width: 130 },
    { title: '身份证号码', dataIndex: '身份证号码', key: '身份证号码', width: 180 },
    { title: '银行卡号', dataIndex: '银行卡号', key: '银行卡号', width: 200 },
    { title: '备注', dataIndex: '备注', key: '备注', ellipsis: true, width: 150 },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right' as const,
      render: (_: any, record: EntryList) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => openEditModal(record)}
        >
          编辑
        </Button>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: 24, background: '#f0f2f5', overflow: 'auto' }}>
        <Card title="入职名单">
          <Form
            ref={searchFormRef}
            form={form}
            layout="inline"
            onFinish={handleSearch}
            style={{ marginBottom: 16 }}
          >
            <Form.Item name="name" label="姓名">
              <Input placeholder="请输入姓名" />
            </Form.Item>
            <Form.Item name="phone" label="联系电话">
              <Input placeholder="请输入联系电话" />
            </Form.Item>
            <Form.Item name="idCard" label="身份证号码">
              <Input placeholder="请输入身份证号码" />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" icon={<SearchOutlined />} htmlType="submit">
                  搜索
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  清空
                </Button>
              </Space>
            </Form.Item>
          </Form>

          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalVisible(true)}>
                添加用户
              </Button>
              <Upload
                accept=".xlsx,.xls"
                showUploadList={false}
                beforeUpload={handleImport}
              >
                <Button icon={<UploadOutlined />} loading={importLoading}>
                  批量导入
                </Button>
              </Upload>
              <Button danger icon={<DeleteOutlined />} onClick={handleDeduplicate}>
                一键去重
              </Button>
            </Space>
            <Space>
              <Button icon={<DownloadOutlined />} onClick={handleExportTemplate}>
                导出模版
              </Button>
              <Button type="primary" icon={<FileExcelOutlined />} onClick={handleExport}>
                导出数据
              </Button>
            </Space>
          </div>

          <Table
            columns={columns}
            dataSource={entries}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1200 }}
            pagination={{ 
              pageSize: pageSize, 
              showSizeChanger: true, 
              showTotal: (total) => `共 ${total} 条`,
              pageSizeOptions: ['10', '20', '50', '100'],
              onShowSizeChange: (_, size) => {
                setPageSize(size)
                fetchData()
              }
            }}
          />
        </Card>
      </div>

      <Modal
        title="添加用户"
        open={addModalVisible}
        onCancel={() => {
          setAddModalVisible(false)
          form.resetFields()
        }}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddUser}
          initialValues={{ 序号: '0' }}
        >
          <Form.Item name="姓名" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item name="身份证号码" label="身份证号码" rules={[{ required: true, message: '请输入身份证号码' }]}>
            <Input placeholder="请输入身份证号码" />
          </Form.Item>
          <Form.Item name="部门" label="部门">
            <Input placeholder="请输入部门" />
          </Form.Item>
          <Form.Item name="岗位" label="岗位">
            <Input placeholder="请输入岗位" />
          </Form.Item>
          <Form.Item name="联系电话" label="联系电话">
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item name="银行卡号" label="银行卡号">
            <Input placeholder="请输入银行卡号" />
          </Form.Item>
          <Form.Item name="备注" label="备注">
            <Input.TextArea placeholder="请输入备注" rows={3} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setAddModalVisible(false)
                form.resetFields()
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                确定
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑用户"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false)
          editForm.resetFields()
          setEditingRecord(null)
        }}
        footer={null}
        width={500}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditUser}
        >
          <Form.Item label="姓名">
            <Input value={editingRecord?.姓名} disabled />
          </Form.Item>
          <Form.Item label="身份证号码">
            <Input value={editingRecord?.身份证号码} disabled />
          </Form.Item>
          <Form.Item name="部门" label="部门">
            <Input placeholder="请输入部门" />
          </Form.Item>
          <Form.Item name="岗位" label="岗位">
            <Input placeholder="请输入岗位" />
          </Form.Item>
          <Form.Item name="联系电话" label="联系电话">
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item name="银行卡号" label="银行卡号">
            <Input placeholder="请输入银行卡号" />
          </Form.Item>
          <Form.Item name="备注" label="备注">
            <Input.TextArea placeholder="请输入备注" rows={3} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setEditModalVisible(false)
                editForm.resetFields()
                setEditingRecord(null)
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                确定
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="确认去重"
        open={deduplicateModalVisible}
        onCancel={() => setDeduplicateModalVisible(false)}
        footer={null}
        width={400}
      >
        <p style={{ marginBottom: 24 }}>
          此操作将删除数据库中重复的记录（保留最早的一条），是否继续？
        </p>
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={() => setDeduplicateModalVisible(false)}>
              取消
            </Button>
            <Button type="primary" danger onClick={handleConfirmDeduplicate}>
              确认去重
            </Button>
          </Space>
        </div>
      </Modal>
    </div>
  )
}