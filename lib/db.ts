import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DATABASE_PATH = path.join(process.cwd(), 'data', 'employee_data.db')

let db: Database.Database | null = null

export function getDB(): Database.Database {
  if (!db) {
    const dataDir = path.dirname(DATABASE_PATH)
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    db = new Database(DATABASE_PATH)
    initTables(db)
  }
  return db
}

function initTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  // 尝试添加 role 字段（如果不存在）
  try {
    db.exec(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`)
  } catch {
    // 字段已存在，忽略错误
  }
  
  // 为现有用户添加默认角色
  db.exec(`
    UPDATE users SET role = 'user' WHERE role IS NULL
  `)
  
  // 将第一个用户设为超级管理员（如果存在）
  db.exec(`
    UPDATE users SET role = 'super_admin' WHERE id = 1 AND role = 'user'
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)
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

export type UserRole = 'super_admin' | 'admin' | 'user'

export interface User {
  id: number
  email: string
  password: string
  name: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface RefreshToken {
  id: number
  user_id: number
  token: string
  expires_at: string
  created_at: string
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

export function createUser(email: string, password: string, name: string, role: UserRole = 'user'): User | null {
  const db = getDB()
  try {
    const result = db.prepare(`
      INSERT INTO users (email, password, name, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(email, password, name, role, new Date().toISOString(), new Date().toISOString())
    
    return db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as User
  } catch (error) {
    console.error('Create user error:', error)
    return null
  }
}

export function getUserByEmail(email: string): User | null {
  const db = getDB()
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | null
}

export function getUserById(id: number): User | null {
  const db = getDB()
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | null
}

export function getAllUsers(): User[] {
  const db = getDB()
  return db.prepare('SELECT id, email, name, role, created_at FROM users ORDER BY id DESC').all() as User[]
}

export function updateUserRole(userId: number, role: UserRole): boolean {
  const db = getDB()
  try {
    const result = db.prepare(`
      UPDATE users SET role = ?, updated_at = ? WHERE id = ?
    `).run(role, new Date().toISOString(), userId)
    return result.changes > 0
  } catch {
    return false
  }
}

export function deleteUser(userId: number): boolean {
  const db = getDB()
  try {
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(userId)
    return result.changes > 0
  } catch {
    return false
  }
}

export function saveRefreshToken(userId: number, token: string, expiresAt: string): void {
  const db = getDB()
  db.prepare(`
    INSERT OR REPLACE INTO refresh_tokens (user_id, token, expires_at, created_at)
    VALUES (?, ?, ?, ?)
  `).run(userId, token, expiresAt, new Date().toISOString())
}

export function getRefreshToken(token: string): RefreshToken | null {
  const db = getDB()
  return db.prepare('SELECT * FROM refresh_tokens WHERE token = ?').get(token) as RefreshToken | null
}

export function deleteRefreshToken(token: string): void {
  const db = getDB()
  db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(token)
}

export function deleteUserRefreshTokens(userId: number): void {
  const db = getDB()
  db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(userId)
}