import type { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { getUserByEmail, saveRefreshToken } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES_IN = '8h'
const REFRESH_TOKEN_EXPIRES_IN = '7d'

const DEFAULT_PASSWORD = '123456'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method Not Allowed' })
    }

    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: '邮箱和密码不能为空' })
    }

    const user = getUserByEmail(email)

    if (!user) {
      return res.status(401).json({ message: '邮箱或密码错误' })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({ message: '邮箱或密码错误' })
    }

    const accessToken = jwt.sign({ userId: user.id, email: user.email, role: user.role || 'user' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
    
    const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN })
    
    const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    saveRefreshToken(user.id, refreshToken, refreshTokenExpiresAt)

    // 检查是否为初始密码
    const isDefaultPassword = await bcrypt.compare(DEFAULT_PASSWORD, user.password)

    // 设置 cookies
    res.setHeader('Set-Cookie', [
      `accessToken=${accessToken}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${60 * 15}`,
      `refreshToken=${refreshToken}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${60 * 60 * 24 * 7}`
    ])

    return res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'user'
      },
      needResetPassword: isDefaultPassword
    })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ message: '登录失败，请稍后重试' })
  }
}