import { useState, useEffect } from 'react'
import { Table, Button, Card, Space, Modal, message } from 'antd'
import { DeleteOutlined, FileTextOutlined, ReloadOutlined } from '@ant-design/icons'
import Sidebar from '../components/Sidebar'
import { ImportError } from '../lib/db'

export default function ImportErrorsPage() {
  const [errors, setErrors] = useState<ImportError[]>([])
  const [loading, setLoading] = useState(true)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedError, setSelectedError] = useState<ImportError | null>(null)
  const [confirmModalVisible, setConfirmModalVisible] = useState(false)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    fetchErrors()
  }, [])

  const fetchErrors = async () => {
    setLoading(true)
    const res = await fetch('/api/import_errors')
    const data = await res.json()
    setErrors(data)
    setLoading(false)
  }

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch('/api/import_errors', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (res.ok) {
        message.success('删除成功')
        fetchErrors()
      } else {
        message.error('删除失败')
      }
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleClearAll = () => {
    setConfirmModalVisible(true)
  }

  const handleConfirmClear = async () => {
    try {
      const res = await fetch('/api/import_errors', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      if (res.ok) {
        message.success('清空成功')
        fetchErrors()
      } else {
        message.error('清空失败')
      }
    } catch (error) {
      message.error('清空失败')
    } finally {
      setConfirmModalVisible(false)
    }
  }

  const showDetail = (error: ImportError) => {
    setSelectedError(error)
    setDetailModalVisible(true)
  }

  const columns = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      render: (_: any, __: any, index: number) => index + 1
    },
    {
      title: '文件名',
      dataIndex: 'file_name',
      key: 'file_name',
      width: 200,
      ellipsis: true
    },
    {
      title: '行号',
      dataIndex: 'row_number',
      key: 'row_number',
      width: 80,
      align: 'center' as const
    },
    {
      title: '错误信息',
      dataIndex: 'error_message',
      key: 'error_message',
      width: 300,
      ellipsis: true
    },
    {
      title: '导入日期',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (text: string) => text?.split(' ')[0] || ''
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: ImportError) => (
        <Space>
          <Button
            type="link"
            icon={<FileTextOutlined />}
            onClick={() => showDetail(record)}
          >
            详情
          </Button>
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: 24, background: '#f0f2f5', overflow: 'auto' }}>
        <Card
          title="错误日志"
          extra={
            <Space>
              <Button icon={<ReloadOutlined />} onClick={fetchErrors}>
                刷新
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleClearAll}
              >
                清空全部
              </Button>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={errors}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: pageSize,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
              pageSizeOptions: ['10', '20', '50', '100'],
              onShowSizeChange: (_, size) => {
                setPageSize(size)
                fetchErrors()
              }
            }}
          />
        </Card>
      </div>

      <Modal
        title="错误详情"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false)
          setSelectedError(null)
        }}
        footer={null}
        width={600}
      >
        {selectedError && (
          <div style={{ padding: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <strong>文件名：</strong>{selectedError.file_name}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>行号：</strong>第 {selectedError.row_number} 行
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>错误信息：</strong>{selectedError.error_message}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>导入时间：</strong>{selectedError.created_at}
            </div>
            <div>
              <strong>原始数据：</strong>
              <pre style={{
                marginTop: 8,
                padding: 12,
                background: '#f5f5f5',
                borderRadius: 4,
                maxHeight: 350,
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}>
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(selectedError.raw_data), null, 2)
                  } catch {
                    return selectedError.raw_data
                  }
                })()}
              </pre>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="确认清空"
        open={confirmModalVisible}
        onOk={handleConfirmClear}
        onCancel={() => setConfirmModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <p>确定要清空所有导入错误记录吗？</p>
      </Modal>
    </div>
  )
}