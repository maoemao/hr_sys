import type { NextApiRequest, NextApiResponse } from 'next'
import { getDB, ImportError } from '../../lib/db'

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ImportError[] | { message: string }>
) {
  const db = getDB()

  if (req.method === 'POST') {
    const { file_name, row_number, error_message, raw_data } = req.body

    const stmt = db.prepare(`
      INSERT INTO import_errors (file_name, row_number, error_message, raw_data)
      VALUES (?, ?, ?, ?)
    `)

    try {
      stmt.run(file_name, row_number, error_message, JSON.stringify(raw_data))
      res.status(200).json({ message: '记录成功' })
    } catch (error) {
      console.error('Insert error:', error)
      res.status(500).json({ message: '记录失败' })
    }
    return
  }

  if (req.method === 'DELETE') {
    console.log('DELETE request received')
    console.log('Request body:', req.body)
    const { id } = req.body
    console.log('Extracted id:', id)
    if (id) {
      console.log('Deleting single record with id:', id)
      const stmt = db.prepare('DELETE FROM import_errors WHERE id = ?')
      stmt.run(id)
    } else {
      console.log('Deleting all records')
      db.prepare('DELETE FROM import_errors').run()
    }
    res.status(200).json({ message: '删除成功' })
    return
  }

  const stmt = db.prepare('SELECT * FROM import_errors ORDER BY created_at DESC')
  const errors = stmt.all() as ImportError[]
  res.status(200).json(errors)
}