# HR System - 人事管理系统

一个基于 Next.js 的人事管理系统，用于管理员工入职名单。

## 功能特性

- 入职名单管理（增删改查）
- Excel 文件导入/导出
- 数据去重
- 导入错误日志记录
- 数据搜索（按姓名、电话、身份证号码）
- 分页功能（可自定义每页条数）

## 技术栈

| 层次 | 技术 | 说明 |
|------|------|------|
| 前端框架 | Next.js + React | 页面渲染和用户交互 |
| UI组件库 | Ant Design 5 | 表格、表单、弹框等组件 |
| 后端框架 | Next.js API Routes | 同一个项目内置后端API |
| 数据库 | SQLite (better-sqlite3) | 轻量级本地数据库 |
| 语言 | TypeScript | 类型安全 |

## 快速开始

### 安装依赖

```bash
npm install
# 或
yarn
```

### 运行开发服务器

```bash
npm run dev
# 或
yarn dev
```

访问 http://localhost:3000 查看应用。

### 构建生产版本

```bash
npm run build
npm start
```

## 项目结构

```
hr_sys/
├── components/        # 公共组件
│   ├── Layout.tsx     # 布局组件
│   └── Sidebar.tsx    # 侧边栏导航
├── lib/               # 工具库
│   └── db.ts          # 数据库配置
├── pages/             # 页面和API路由
│   ├── api/           # API 接口
│   │   ├── entry_list/    # 入职名单相关API
│   │   │   ├── deduplicate.ts  # 数据去重
│   │   │   ├── export.ts      # Excel导出
│   │   │   ├── import.ts      # Excel导入
│   │   │   └── template.ts    # 导入模板
│   │   ├── entry_list.ts      # 入职名单CRUD
│   │   └── import_errors.ts   # 导入错误日志
│   ├── entry_list.tsx     # 入职名单页面
│   ├── import_errors.tsx  # 导入错误日志页面
│   ├── index.tsx          # 首页
│   └── login.tsx          # 登录页
├── styles/            # 样式文件
├── data/              # 数据库文件目录
│   └── employee_data.db
└── package.json
```

## 前后端架构

这是一个基于 **Next.js** 的全栈项目，采用 **前后端一体化** 架构。

### 架构图

```
┌─────────────────────────────────────────────────────────┐
│                     浏览器 (Browser)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  页面组件    │  │  API调用    │  │  状态管理        │  │
│  │  React     │  │  fetch()    │  │  useState       │  │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────┘  │
└─────────┼────────────────┼────────────────────────────────┘
          │                │
          │ HTTP Request   │ HTTP Response (JSON)
          ▼                ▼
┌─────────────────────────────────────────────────────────┐
│                  Next.js 服务器                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │              API Routes (后端)                    │    │
│  │  pages/api/entry_list.ts    - 增删改查           │    │
│  │  pages/api/entry_list/import.ts - Excel导入       │    │
│  │  pages/api/entry_list/export.ts - Excel导出       │    │
│  │  pages/api/import_errors.ts  - 错误日志           │    │
│  └──────────────────────┬──────────────────────────┘    │
│                         │                                │
│  ┌──────────────────────▼──────────────────────────┐    │
│  │              lib/db.ts (数据库层)               │    │
│  │  - SQLite 连接管理                               │    │
│  │  - 表结构初始化                                  │    │
│  │  - 数据模型定义                                  │    │
│  └──────────────────────┬──────────────────────────┘    │
└─────────────────────────┼────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              SQLite 数据库 (data/employee_data.db)       │
│  ┌─────────────────┐    ┌─────────────────────────┐    │
│  │   entry_list   │    │    import_errors       │    │
│  │   入职名单表     │    │    导入错误日志表        │    │
│  └─────────────────┘    └─────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 前端工作流程

以"入职名单"页面为例：

```typescript
// 1. 页面加载时，自动获取数据
useEffect(() => {
  fetchData()  // 调用API获取数据
}, [])

// 2. 用户搜索时，调用API过滤数据
const handleSearch = (values) => {
  fetchData(values)  // 传递搜索参数到API
}

// 3. 用户新增/编辑/删除后，重新获取数据
const handleAddUser = async (values) => {
  await fetch('/api/entry_list', {
    method: 'POST',
    body: JSON.stringify(values)
  })
  fetchData()  // 刷新列表
}
```

### 后端工作流程 (API Routes)

```typescript
// pages/api/entry_list.ts
export default async function handler(req, res) {
  if (req.method === 'GET') {
    // 查询数据
    const db = getDB()
    const entries = db.prepare('SELECT * FROM entry_list').all()
    res.json(entries)  // 返回JSON给前端
  }
  else if (req.method === 'POST') {
    // 新增数据
    const db = getDB()
    const stmt = db.prepare('INSERT INTO entry_list ...')
    stmt.run(...)
    res.json({ success: true })
  }
}
```

### 数据流向示例

**场景：用户导入 Excel 文件**

```
1. 用户点击"导入"按钮，选择 Excel 文件

2. 前端 (entry_list.tsx):
   const handleImport = async (file) => {
     const formData = new FormData()
     formData.append('file', file)

     await fetch('/api/entry_list/import', {
       method: 'POST',
       body: formData
     })
   }

3. 后端 (api/entry_list/import.ts):
   - 解析 Excel 文件
   - 验证每行数据
   - 正确的数据插入 entry_list 表
   - 错误的数据插入 import_errors 表
   - 返回导入结果

4. 前端收到结果:
   - 显示成功/失败提示
   - 重新获取列表数据
   - 刷新页面显示最新数据
```

## API 接口

| 接口 | 方法 | 功能 |
|------|------|------|
| `/api/entry_list` | GET | 获取入职名单列表 |
| `/api/entry_list` | POST | 新增员工 |
| `/api/entry_list` | PUT | 编辑员工 |
| `/api/entry_list` | DELETE | 删除员工 |
| `/api/entry_list/import` | POST | 导入 Excel |
| `/api/entry_list/export` | GET | 导出 Excel |
| `/api/entry_list/template` | GET | 下载导入模板 |
| `/api/entry_list/deduplicate` | POST | 数据去重 |
| `/api/import_errors` | GET | 获取错误日志 |
| `/api/import_errors` | DELETE | 清空错误日志 |

## 数据库

项目使用 SQLite 数据库，数据库文件位于 `data/employee_data.db`。

首次运行时会自动创建必要的表结构：

- **entry_list**: 入职名单表
- **import_errors**: 导入错误日志表

## 局域网部署

### 1. 启动服务（监听局域网）

```bash
npx next start -H 0.0.0.0 -p 3000
```

### 2. 防火墙设置（如需要）

**Linux (Ubuntu/Debian):**
```bash
sudo ufw allow 3000/tcp
```

**macOS:**
- 打开 系统设置 > 网络 > 防火墙
- 允许 终端 或 Node.js 接收传入连接

### 3. 访问

在同一局域网内的其他设备上访问：`http://服务器IP:3000`

### 4. 保持服务运行（使用 PM2）

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start npx --name "hr-system" -- start -H 0.0.0.0 -p 3000

# 查看状态
pm2 status

# 重启/停止
pm2 restart hr-system
pm2 stop hr-system
```

## 使用说明

1. 访问系统后进入入职名单页面
2. 可通过 Excel 文件导入员工数据
3. 支持按姓名、电话、身份证号码搜索
4. 导入失败的数据会记录在错误日志中
5. 可使用去重功能处理重复数据
6. 支持自定义每页显示条数（10/20/50/100）
