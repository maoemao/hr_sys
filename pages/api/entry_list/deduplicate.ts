import type { NextApiRequest, NextApiResponse } from 'next'
import { getDB } from '../../../lib/db'

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ message: string; deleted?: number }>
) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: '只支持POST方法' })
    return
  }

  try {
    const db = getDB()

    const duplicateStmt = db.prepare(`
      SELECT 身份证号码, COUNT(*) as count
      FROM entry_list
      GROUP BY 身份证号码
      HAVING COUNT(*) > 1
    `)

    const duplicates = duplicateStmt.all() as { 身份证号码: string; count: number }[]
    
    if (duplicates.length === 0) {
      res.status(200).json({ message: '没有重复数据', deleted: 0 })
      return
    }

    let deletedCount = 0

    const errorStmt = db.prepare(`
      INSERT INTO import_errors (file_name, row_number, error_message, raw_data)
      VALUES (?, ?, ?, ?)
    `)

    for (const item of duplicates) {
      const getDuplicatesStmt = db.prepare(`
        SELECT * FROM entry_list
        WHERE 身份证号码 = ?
        AND id NOT IN (SELECT MIN(id) FROM entry_list WHERE 身份证号码 = ?)
      `)
      
      const toDelete = getDuplicatesStmt.all(item.身份证号码, item.身份证号码) as any[]

      const deleteStmt = db.prepare(`
        DELETE FROM entry_list
        WHERE 身份证号码 = ?
        AND id NOT IN (SELECT MIN(id) FROM entry_list WHERE 身份证号码 = ?)
      `)
      
      const result = deleteStmt.run(item.身份证号码, item.身份证号码)
      deletedCount += result.changes || 0

      for (const record of toDelete) {
        errorStmt.run(
          'deduplicate',
          record.id,
          `身份证号码重复被删除（保留ID最小的记录）`,
          JSON.stringify(record)
        )
      }
    }

    res.status(200).json({
      message: `去重完成，共删除 ${deletedCount} 条重复记录`,
      deleted: deletedCount
    })
  } catch (error) {
    console.error('Deduplicate error:', error)
    res.status(500).json({ message: '去重失败' })
  }
}