import type { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { getUserById, getUserByEmail } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { email, oldPassword, newPassword, confirmPassword } = req.body
    
    if (!email || !oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: '请填写完整信息' })
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: '新密码与确认密码不一致' })
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: '密码长度至少为6位' })
    }
    
    const user = getUserByEmail(email)
    if (!user) {
      return res.status(404).json({ message: '用户不存在' })
    }
    
    const isOldPasswordValid = bcrypt.compareSync(oldPassword, user.password)
    if (!isOldPasswordValid) {
      return res.status(400).json({ message: '旧密码不正确' })
    }
    
    const hashedPassword = bcrypt.hashSync(newPassword, 10)
    const db = require('@/lib/db').getDB()
    try {
      db.prepare(`
        UPDATE users SET password = ?, updated_at = ? WHERE id = ?
      `).run(hashedPassword, new Date().toISOString(), user.id)
      return res.status(200).json({ message: '密码重置成功' })
    } catch {
      return res.status(500).json({ message: '密码重置失败' })
    }
  }
  
  res.status(405).json({ message: 'Method Not Allowed' })
}