import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { createUser, getUserByEmail } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method Not Allowed' })
    }

    const { email, password, name } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({ message: '邮箱、密码和姓名不能为空' })
    }

    if (password.length < 6) {
      return res.status(400).json({ message: '密码长度不能少于6位' })
    }

    const existingUser = getUserByEmail(email)

    if (existingUser) {
      return res.status(409).json({ message: '该邮箱已被注册' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = createUser(email, hashedPassword, name)

    if (!user) {
      return res.status(500).json({ message: '注册失败，请稍后重试' })
    }

    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })
  } catch (error) {
    console.error('Register error:', error)
    return res.status(500).json({ message: '注册失败，请稍后重试' })
  }
}