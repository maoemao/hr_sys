import Database from 'better-sqlite3'
import path from 'path'

const DATABASE_PATH = path.join(process.cwd(), 'data', 'employee_data.db')

let db: Database.Database | null = null

export function getDB(): Database.Database {
  if (!db) {
    db = new Database(DATABASE_PATH)
    initTables(db)
  }
  return db
}

function initTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS import_errors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_name TEXT,
      row_number INTEGER,
      error_message TEXT,
      raw_data TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)
  db.exec(`
    CREATE TABLE IF NOT EXISTS entry_list (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      序号 TEXT,
      部门 TEXT,
      姓名 TEXT NOT NULL,
      岗位 TEXT,
      联系电话 TEXT,
      身份证号码 TEXT,
      银行卡号 TEXT,
      备注 TEXT,
      来源表 TEXT
    )
  `)
}

export interface EntryList {
  id: number
  序号: string
  部门: string
  姓名: string
  岗位: string
  联系电话: string
  身份证号码: string
  银行卡号: string
  备注: string
  来源表: string
}

export interface ImportError {
  id: number
  file_name: string
  row_number: number
  error_message: string
  raw_data: string
  created_at: string
}

export interface WorkHours {
  id: number
  序号: string
  部门: string
  姓名: string
  岗位: string
  联系电话: string
  身份证号码: string
  总工时: string
  备注: string
  月份: string
  来源表: string
}

export interface Salary {
  id: number
  序号: string
  部门: string
  姓名: string
  岗位: string
  联系电话: string
  身份证号码: string
  银行卡号: string
  工资: string
  备注: string
  月份: string
  来源表: string
}