import type { NextApiRequest, NextApiResponse } from 'next'
import { getDB, EntryList } from '../../lib/db'
import * as XLSX from 'xlsx'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// 验证登录态的中间件函数
function authenticate(req: NextApiRequest): boolean {
  // 从 Authorization header 获取 token
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    try {
      jwt.verify(token, JWT_SECRET)
      return true
    } catch {
      return false
    }
  }
  
  // 从 cookies 获取 token
  const cookies = req.cookies
  if (cookies && cookies.accessToken) {
    try {
      jwt.verify(cookies.accessToken, JWT_SECRET)
      return true
    } catch {
      return false
    }
  }
  
  return false
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<EntryList[] | { message: string } | Buffer>
) {
  // 验证登录态
  if (!authenticate(req)) {
    return res.status(401).json({ message: '未登录，请先登录' })
  }

  const db = getDB()

  if (req.method === 'POST') {
    const { 姓名, 身份证号码, 部门, 岗位, 联系电话, 银行卡号, 备注 } = req.body

    const stmt = db.prepare(`
      INSERT INTO entry_list (序号, 部门, 姓名, 岗位, 联系电话, 身份证号码, 银行卡号, 备注, 来源表)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    try {
      const result = stmt.run('0', 部门 || '', 姓名, 岗位 || '', 联系电话 || '', 身份证号码, 银行卡号 || '', 备注 || '', 'entry_list')
      res.status(200).json({ message: '添加成功' })
    } catch (error) {
      res.status(500).json({ message: '添加失败' })
    }
    return
  }

  if (req.method === 'PUT') {
    const { id, 部门, 岗位, 联系电话, 银行卡号, 备注 } = req.body

    const stmt = db.prepare(`
      UPDATE entry_list SET 部门 = ?, 岗位 = ?, 联系电话 = ?, 银行卡号 = ?, 备注 = ?
      WHERE id = ?
    `)

    try {
      stmt.run(部门 || '', 岗位 || '', 联系电话 || '', 银行卡号 || '', 备注 || '', id)
      res.status(200).json({ message: '修改成功' })
    } catch (error) {
      res.status(500).json({ message: '修改失败' })
    }
    return
  }

  if (req.method === 'DELETE') {
    res.status(200).json({ message: '删除成功' })
    return
  }

  const name = req.query.name as string || ''
  const phone = req.query.phone as string || ''
  const idCard = req.query.idCard as string || ''

  let entries: EntryList[]

  if (name || phone || idCard) {
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
    entries = stmt.all(...params) as EntryList[]
  } else {
    const stmt = db.prepare('SELECT * FROM entry_list ORDER BY id DESC')
    entries = stmt.all() as EntryList[]
  }

  res.status(200).json(entries)
}