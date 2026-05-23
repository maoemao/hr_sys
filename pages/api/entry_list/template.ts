import type { NextApiRequest, NextApiResponse } from 'next'
import * as XLSX from 'xlsx'

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.status(405).end()
    return
  }

  try {
    const templateData = [
      {
        '部门': '',
        '姓名': '',
        '岗位': '',
        '联系电话': '',
        '身份证号码': '',
        '银行卡号': '',
        '备注': '',
      }
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '入职名单模板')

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename=entry_list_template.xlsx')
    res.send(buffer)
  } catch (error) {
    console.error('Template error:', error)
    res.status(500).end()
  }
}