import type { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { getUserById } from '@/lib/db'
import type { UserRole } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

function authenticate(req: NextApiRequest): { userId: number; role: UserRole } | null {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: UserRole }
      return decoded
    } catch {
      return null
    }
  }
  return null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }
  
  const auth = authenticate(req)
  if (!auth) {
    return res.status(401).json({ message: '未登录' })
  }
  
  if (auth.role !== 'super_admin') {
    return res.status(403).json({ message: '权限不足' })
  }
  
  const { userId } = req.body
  
  if (!userId) {
    return res.status(400).json({ message: '请提供用户ID' })
  }
  
  if (userId === auth.userId) {
    return res.status(400).json({ message: '不能重置自己的密码' })
  }
  
  const user = getUserById(userId)
  if (!user) {
    return res.status(404).json({ message: '用户不存在' })
  }
  
  const defaultPassword = '123456'
  const hashedPassword = bcrypt.hashSync(defaultPassword, 10)
  const db = require('@/lib/db').getDB()
  
  try {
    db.prepare(`
      UPDATE users SET password = ?, updated_at = ? WHERE id = ?
    `).run(hashedPassword, new Date().toISOString(), userId)
    return res.status(200).json({ message: '密码已重置为 123456' })
  } catch {
    return res.status(500).json({ message: '密码重置失败' })
  }
}