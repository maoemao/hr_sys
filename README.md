# HR System - 人事管理系统

一个基于 Next.js 的人事管理系统，用于管理员工入职名单。

## 功能特性

- 入职名单管理（增删改查）
- Excel 文件导入/导出
- 数据去重
- 导入错误日志记录
- 数据搜索（按姓名、电话、身份证号码）

## 技术栈

- **前端**: Next.js 16 + React 19 + Ant Design 5
- **后端**: Next.js API Routes
- **数据库**: SQLite (better-sqlite3)
- **语言**: TypeScript

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
npm run start
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
│   │   └── import_errors.ts
│   ├── entry_list.tsx     # 入职名单页面
│   ├── import_errors.tsx  # 导入错误日志页面
│   ├── index.tsx          # 首页
│   └── login.tsx          # 登录页
├── styles/            # 样式文件
├── data/              # 数据库文件目录
│   └── employee_data.db
└── package.json
```

## 数据库

项目使用 SQLite 数据库，数据库文件位于 `data/employee_data.db`。

首次运行时会自动创建必要的表结构。

## 使用说明

1. 访问系统后进入入职名单页面
2. 可通过 Excel 文件导入员工数据
3. 支持按姓名、电话、身份证号码搜索
4. 导入失败的数据会记录在错误日志中
5. 可使用去重功能处理重复数据
