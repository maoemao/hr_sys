# HR System - 人事管理系统

一个基于 Next.js 的人事管理系统，用于管理员工入职名单。

## 功能特性

- 🔐 **用户认证**
  - 用户登录（邮箱/密码）
  - 退出登录
  - JWT + Refresh Token 认证机制
  - 初始密码检测与强制修改
  - 重置密码功能

- 📋 **入职名单管理**
  - 入职名单管理（增删改查）
  - Excel 文件导入/导出
  - 数据去重
  - 导入错误日志记录
  - 数据搜索（按姓名、电话、身份证号码）
  - 分页功能（可自定义每页条数）

- 👥 **权限管理**（仅超级管理员可见）
  - 用户列表展示
  - 创建新用户
  - 编辑用户角色
  - 删除用户
  - 重置用户密码

- 🔒 **角色权限体系**
  - **超级管理员**：可管理所有用户、导出数据
  - **管理员**：可查看名单、导入数据
  - **普通用户**：仅可查看名单

## 技术栈

| 层次 | 技术 | 说明 |
|------|------|------|
| 前端框架 | Next.js 16 + React 19 | 页面渲染和用户交互 |
| UI组件库 | Ant Design 5 | 表格、表单、弹框等组件 |
| 状态管理 | Zustand | 轻量级状态管理 |
| 数据请求 | Axios + TanStack Query | HTTP 请求和缓存 |
| 认证机制 | JWT + Refresh Token | 用户认证 |
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
│   └── Sidebar.tsx    # 侧边栏导航（显示当前用户信息）
├── lib/               # 工具库
│   ├── db.ts          # 数据库配置
│   ├── axios.ts       # Axios 配置
│   └── queryClient.ts # TanStack Query 配置
├── store/             # 状态管理
│   └── authStore.ts   # 认证状态管理
├── pages/             # 页面和API路由
│   ├── api/           # API 接口
│   │   ├── auth/          # 认证相关API
│   │   │   ├── login.ts    # 登录接口
│   │   │   ├── register.ts # 注册接口
│   │   │   ├── refresh.ts  # 刷新Token
│   │   │   ├── logout.ts   # 退出登录
│   │   │   ├── users.ts    # 用户管理（需超级管理员权限）
│   │   │   ├── reset-password.ts      # 用户重置密码
│   │   │   └── admin-reset-password.ts # 管理员重置用户密码
│   │   ├── entry_list/     # 入职名单相关API
│   │   ├── entry_list.ts      # 入职名单CRUD
│   │   └── import_errors.ts   # 导入错误日志
│   ├── entry_list.tsx     # 入职名单页面
│   ├── import_errors.tsx  # 错误日志页面
│   ├── admin/users.tsx    # 用户管理页面（仅超级管理员）
│   ├── reset-password.tsx # 重置密码页面
│   ├── index.tsx          # 首页
│   └── login.tsx          # 登录页
├── styles/            # 样式文件
├── data/              # 数据库文件目录
│   └── employee_data.db
├── middleware.ts      # 路由中间件（认证保护）
└── package.json
```

## 认证机制

### JWT + Refresh Token 流程

```
┌─────────────────────────────────────────────────────────────┐
│ 登录流程                                                    │
├─────────────────────────────────────────────────────────────┤
│ 1. 用户提交登录表单                                         │
│ 2. 后端验证用户凭据                                         │
│ 3. 生成 accessToken (15分钟) 和 refreshToken (7天)         │
│ 4. 通过 Set-Cookie 设置 HttpOnly cookies                   │
│ 5. 检查是否为初始密码（123456），返回 needResetPassword     │
│ 6. 如需重置密码，跳转到重置密码页面                         │
│ 7. 前端存储到 localStorage 和 Zustand store                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 请求流程                                                    │
├─────────────────────────────────────────────────────────────┤
│ 1. 前端请求时自动携带 Authorization: Bearer <token>         │
│ 2. Middleware 验证 accessToken                             │
│ 3. Token 有效 → 允许访问                                   │
│ 4. Token 过期 → 返回 401                                   │
│ 5. Axios 拦截器自动调用 refresh 接口                       │
│ 6. 获取新的 accessToken 并重试请求                          │
└─────────────────────────────────────────────────────────────┘
```

### 路由保护

通过 `middleware.ts` 实现路由保护：

- **公开路由**: `/login`, `/register`, `/reset-password`
- **受保护路由**: `/entry_list`, `/import_errors`, `/admin/users`, `/`
- **仅超级管理员**: `/admin/users`

未登录用户访问受保护路由会自动重定向到登录页。

## 角色权限说明

| 权限 | 超级管理员 | 管理员 | 普通用户 |
|------|-----------|--------|---------|
| 查看入职名单 | ✓ | ✓ | ✓ |
| 添加/编辑员工 | ✓ | ✓ | ✓ |
| 导入数据 | ✓ | ✓ | ✓ |
| 导出数据 | ✓ | ✓ | ✗ |
| 权限管理页面 | ✓ | ✗ | ✗ |
| 创建账号 | ✓ | ✗ | ✗ |
| 修改角色 | ✓ | ✗ | ✗ |
| 删除账号 | ✓ | ✗ | ✗ |
| 重置密码 | ✓ | ✗ | ✗ |

## API 接口

### 认证接口

| 接口 | 方法 | 功能 |
|------|------|------|
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/register` | POST | 用户注册 |
| `/api/auth/refresh` | POST | 刷新 Token |
| `/api/auth/logout` | POST | 退出登录 |
| `/api/auth/reset-password` | POST | 用户重置自己密码 |
| `/api/auth/admin-reset-password` | POST | 管理员重置用户密码（需超级管理员） |
| `/api/auth/users` | GET | 获取用户列表（需超级管理员） |
| `/api/auth/users` | POST | 创建用户（需超级管理员） |
| `/api/auth/users` | PUT | 更新用户角色（需超级管理员） |
| `/api/auth/users` | DELETE | 删除用户（需超级管理员） |

### 入职名单接口

| 接口 | 方法 | 功能 |
|------|------|------|
| `/api/entry_list` | GET | 获取入职名单列表（需登录） |
| `/api/entry_list` | POST | 新增员工（需登录） |
| `/api/entry_list` | PUT | 编辑员工（需登录） |
| `/api/entry_list` | DELETE | 删除员工（需登录） |
| `/api/entry_list/import` | POST | 导入 Excel（需登录） |
| `/api/entry_list/export` | GET | 导出 Excel（需登录） |
| `/api/entry_list/template` | GET | 下载导入模板 |
| `/api/entry_list/deduplicate` | POST | 数据去重（需登录） |

### 错误日志接口

| 接口 | 方法 | 功能 |
|------|------|------|
| `/api/import_errors` | GET | 获取错误日志（需登录） |
| `/api/import_errors` | DELETE | 清空错误日志（需登录） |

### 登录请求示例

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@qq.com", "password": "123456"}'
```

### 注册请求示例

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "张三", "email": "zhangsan@example.com", "password": "123456"}'
```

## 数据库

项目使用 SQLite 数据库，数据库文件位于 `data/employee_data.db`。

首次运行时会自动创建必要的表结构：

- **users**: 用户表（包含 role 字段）
- **entry_list**: 入职名单表
- **import_errors**: 导入错误日志表
- **refresh_tokens**: 刷新令牌存储表

## 默认账号

系统包含一个只读管理员账号：

```
邮箱: admin@qq.com
密码: 123456
角色: 超级管理员（只读，不可删除和重置密码）
```

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

1. **访问登录页面** - 打开 http://localhost:3000/login
2. **登录系统** - 使用邮箱和密码登录
3. **首次登录** - 如使用初始密码（123456），会跳转到重置密码页面
4. **管理入职名单** - 登录后进入入职名单页面
5. **导入数据** - 点击导入按钮选择 Excel 文件
6. **搜索数据** - 使用搜索框按姓名、电话或身份证号码搜索
7. **查看错误日志** - 点击侧边栏"错误日志"查看导入错误
8. **权限管理** - 超级管理员可管理用户账号（仅超级管理员可见）
9. **退出登录** - 点击左侧侧边栏底部的"退出登录"按钮

## 安全特性

- ✅ JWT Token 认证
- ✅ HttpOnly Cookies（防止 XSS 攻击）
- ✅ 密码加密存储（bcrypt）
- ✅ 路由级别的访问控制
- ✅ 接口级别的登录验证
- ✅ Token 过期自动刷新
- ✅ 初始密码强制修改
- ✅ 角色权限分级控制
- ✅ 只读账号保护

## 许可证

MIT License