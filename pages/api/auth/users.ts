import type { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { getAllUsers, createUser, updateUserRole, deleteUser, UserRole } from '@/lib/db'

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

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = authenticate(req)
  if (!auth) {
    return res.status(401).json({ message: '未登录' })
  }

  if (auth.role !== 'super_admin') {
    return res.status(403).json({ message: '权限不足' })
  }

  if (req.method === 'GET') {
    const users = getAllUsers()
    return res.status(200).json(users)
  }

  if (req.method === 'POST') {
    const { email, password, name, role = 'user' } = req.body
    
    if (!email || !password || !name) {
      return res.status(400).json({ message: '请填写完整信息' })
    }

    const hashedPassword = bcrypt.hashSync(password, 10)
    const newUser = createUser(email, hashedPassword, name, role as UserRole)
    
    if (!newUser) {
      return res.status(500).json({ message: '创建用户失败，邮箱已存在' })
    }

    return res.status(200).json({ 
      id: newUser.id, 
      email: newUser.email, 
      name: newUser.name, 
      role: newUser.role 
    })
  }

  if (req.method === 'PUT') {
    const { userId, role } = req.body
    
    if (!userId || !role) {
      return res.status(400).json({ message: '请提供用户ID和角色' })
    }

    const success = updateUserRole(userId, role as UserRole)
    if (success) {
      return res.status(200).json({ message: '角色更新成功' })
    }
    return res.status(500).json({ message: '更新失败' })
  }

  if (req.method === 'DELETE') {
    const { userId } = req.body
    
    if (!userId) {
      return res.status(400).json({ message: '请提供用户ID' })
    }

    if (userId === auth.userId) {
      return res.status(400).json({ message: '不能删除自己' })
    }

    const success = deleteUser(userId)
    if (success) {
      return res.status(200).json({ message: '删除成功' })
    }
    return res.status(500).json({ message: '删除失败' })
  }

  res.status(405).json({ message: 'Method Not Allowed' })
}