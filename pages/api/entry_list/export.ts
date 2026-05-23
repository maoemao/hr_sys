import type { NextApiRequest, NextApiResponse } from 'next'
import { getDB, EntryList } from '../../../lib/db'
import * as XLSX from 'xlsx'

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ message: string }>
) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: '只支持POST方法' })
    return
  }

  try {
    const db = getDB()
    const { name, phone, idCard } = req.body

    let entries: EntryList[]
    let sql = 'SELECT * FROM entry_list WHERE 1=1'
    const params: string[] = []

    if (name) {
      sql += ' AND 姓名 LIKE ?'
      params.push(`%${name}%`)
    }
    if (phone) {
      sql += ' AND 联系电话 LIKE ?'
      params.push(`%${phone}%`)
    }
    if (idCard) {
      sql += ' AND 身份证号码 LIKE ?'
      params.push(`%${idCard}%`)
    }
    sql += ' ORDER BY id DESC'

    const stmt = db.prepare(sql)
    entries = params.length > 0 ? stmt.all(...params) as EntryList[] : stmt.all() as EntryList[]

    const exportData = entries.map((entry, index) => ({
      '序号': index + 1,
      '部门': entry.部门 || '',
      '姓名': entry.姓名 || '',
      '岗位': entry.岗位 || '',
      '联系电话': entry.联系电话 || '',
      '身份证号码': entry.身份证号码 || '',
      '银行卡号': entry.银行卡号 || '',
      '备注': entry.备注 || '',
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '入职名单')

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename=entry_list_${Date.now()}.xlsx`)
    res.send(buffer)
  } catch (error) {
    console.error('Export error:', error)
    res.status(500).json({ message: '导出失败' })
  }
}