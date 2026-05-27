import type { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import { getRefreshToken, saveRefreshToken, getUserById } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES_IN = '8h'
const REFRESH_TOKEN_EXPIRES_IN = '7d'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const { refreshToken } = req.body

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required' })
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as { userId: number }
    
    const storedToken = getRefreshToken(refreshToken)
    
    if (!storedToken) {
      return res.status(401).json({ message: 'Invalid refresh token' })
    }

    if (new Date(storedToken.expires_at) < new Date()) {
      return res.status(401).json({ message: 'Refresh token expired' })
    }

    const user = getUserById(decoded.userId)
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }

    const newAccessToken = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
    
    const newRefreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN })
    
    const newRefreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    saveRefreshToken(user.id, newRefreshToken, newRefreshTokenExpiresAt)

    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    })
  } catch (error) {
    return res.status(401).json({ message: 'Invalid refresh token' })
  }
}