import type { NextApiRequest, NextApiResponse } from 'next'
import { getDB } from '../../../lib/db'
import * as XLSX from 'xlsx'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ message: string; success?: number; failed?: number; duplicated?: number; errors?: string[] }>
) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: '只支持POST方法' })
    return
  }

  try {
    const { fileContent, fileName } = req.body
    
    if (!fileContent) {
      res.status(400).json({ message: '请上传文件' })
      return
    }

    const db = getDB()
    
    const workbook = XLSX.read(fileContent, { type: 'base64' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet)

    if (!jsonData || jsonData.length === 0) {
      res.status(400).json({ message: '文件中没有数据' })
      return
    }

    const requiredFields = ['姓名', '身份证号码']
    const firstRow = jsonData[0] as any
    
    for (const field of requiredFields) {
      if (!(field in firstRow)) {
        res.status(400).json({ message: `缺少必填字段: ${field}` })
        return
      }
    }

    let successCount = 0
    let failedCount = 0
    let duplicatedCount = 0
    const errors: string[] = []

    const checkStmt = db.prepare(`
      SELECT COUNT(*) as count FROM entry_list WHERE 身份证号码 = ?
    `)

    const maxSeqStmt = db.prepare(`
      SELECT MAX(CAST(序号 AS INTEGER)) as maxSeq FROM entry_list
    `)

    const getMaxSeq = () => {
      const result = maxSeqStmt.get() as { maxSeq: number | null }
      return result.maxSeq || 0
    }

    let currentMaxSeq = getMaxSeq()

    const insertStmt = db.prepare(`
      INSERT INTO entry_list (序号, 部门, 姓名, 岗位, 联系电话, 身份证号码, 银行卡号, 备注, 来源表)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const errorStmt = db.prepare(`
      INSERT INTO import_errors (file_name, row_number, error_message, raw_data)
      VALUES (?, ?, ?, ?)
    `)

    for (let i = 0; i < jsonData.length; i++) {
      try {
        const rowData = jsonData[i] as any
        
        if (!rowData['姓名'] || !rowData['身份证号码']) {
          const errorMsg = '姓名或身份证号码为空'
          errors.push(`第${i + 2}行：${errorMsg}`)
          errorStmt.run(fileName, i + 2, errorMsg, JSON.stringify(rowData))
          failedCount++
          continue
        }

        const exists = checkStmt.get(rowData['身份证号码']) as { count: number }
        
        if (exists && exists.count > 0) {
          const errorMsg = `身份证号码已存在（重复数据）`
          errors.push(`第${i + 2}行：${errorMsg}`)
          errorStmt.run(fileName, i + 2, errorMsg, JSON.stringify(rowData))
          duplicatedCount++
          continue
        }

        currentMaxSeq++
        insertStmt.run(
          String(currentMaxSeq),
          rowData['部门'] || '',
          rowData['姓名'] || '',
          rowData['岗位'] || '',
          rowData['联系电话'] || '',
          rowData['身份证号码'] || '',
          rowData['银行卡号'] || '',
          rowData['备注'] || '',
          'import_' + fileName
        )
        successCount++
      } catch (error: any) {
        const errorMsg = error.message || '导入失败'
        errors.push(`第${i + 2}行：${errorMsg}`)
        errorStmt.run(fileName, i + 2, errorMsg, JSON.stringify(jsonData[i]))
        failedCount++
      }
    }

    res.status(200).json({
      message: `导入完成`,
      success: successCount,
      failed: failedCount,
      duplicated: duplicatedCount,
      errors: errors.length > 0 ? errors.slice(0, 20) : undefined
    })
  } catch (error) {
    console.error('Import error:', error)
    res.status(500).json({ message: '导入失败' })
  }
}