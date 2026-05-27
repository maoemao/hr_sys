import type { NextApiRequest, NextApiResponse } from 'next'
import { deleteRefreshToken } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const { refreshToken } = req.body

  if (refreshToken) {
    deleteRefreshToken(refreshToken)
  }

  // 清除 HttpOnly cookies
  res.setHeader('Set-Cookie', [
    `accessToken=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`,
    `refreshToken=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`
  ])

  return res.status(200).json({ message: 'Logout successful' })
}