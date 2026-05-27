# HR管理系统 - Windows部署指南

## 📋 环境要求

- **操作系统**: Windows 10/11 (64位)
- **Node.js**: v18.x 或更高版本（推荐 LTS）
- **内存**: 至少 2GB
- **存储空间**: 至少 1GB 可用空间

---

## 🛠️ 步骤一：安装必要工具

### 1. 安装 Node.js

1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载 **LTS 版本**（推荐）
3. 运行安装程序，确保勾选 **"Add to PATH"**
4. 验证安装：
   ```cmd
   node --version
   npm --version
   ```

### 2. 安装 Python（用于编译 better-sqlite3）

1. 访问 [Python 官网](https://www.python.org/downloads/windows/)
2. 下载 Python 3.8+ 版本
3. 安装时勾选 **"Add Python to PATH"**
4. 验证安装：
   ```cmd
   python --version
   ```

### 3. 安装 Windows Build Tools

打开 **管理员 PowerShell** 运行：
```powershell
npm install -g windows-build-tools
```

如果遇到问题，可以手动安装：
1. 安装 [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
2. 勾选 "Desktop development with C++" 组件

---

## 📦 步骤二：配置项目

### 1. 复制项目文件

将整个项目文件夹复制到本地，例如 `D:\hr_sys`

### 2. 安装依赖

打开 **命令提示符** 或 **PowerShell**，进入项目目录：
```cmd
cd D:\hr_sys
npm install
```

> ⚠️ 注意：首次安装可能需要几分钟，因为需要编译 `better-sqlite3` 原生模块

### 3. 设置环境变量（可选）

创建 `.env.local` 文件（如果不存在），添加以下内容：
```env
JWT_SECRET=your-secret-key-here-make-it-long-and-secure
```

---

## 🚀 步骤三：启动项目

### 开发模式（推荐）

```cmd
npm run dev
```

启动后访问：`http://localhost:3000`

### 生产构建

```cmd
npm run build
npm start
```

---

## 🔧 常见问题解决

### 问题 1: better-sqlite3 安装失败

**原因**: 缺少编译环境

**解决**:
1. 确保已安装 Python 和 Visual Studio Build Tools
2. 以管理员身份运行命令行
3. 尝试：
   ```cmd
   npm rebuild better-sqlite3 --force
   ```

### 问题 2: 端口被占用

**解决**:
```cmd
# 查找占用端口的进程
netstat -ano | findstr :3000

# 终止进程（替换 PID 为实际进程号）
taskkill /F /PID <PID>
```

### 问题 3: 页面显示空白或报错

**解决**:
1. 检查控制台输出是否有错误
2. 清理缓存并重启：
   ```cmd
   npm run clean
   npm run dev
   ```

### 问题 4: SQLite 数据库写入权限问题

**解决**:
1. 确保项目目录有写入权限
2. 手动创建 `data` 目录：
   ```cmd
   mkdir data
   ```

---

## 🌐 局域网访问（可选）

如果需要让局域网内其他设备访问：

```cmd
npm run dev -- -H 0.0.0.0 -p 3000
```

其他设备访问：`http://你的IP:3000`

---

## 📁 项目目录结构

```
hr_sys/
├── components/          # 公共组件
├── lib/                 # 工具库（数据库配置等）
├── store/               # 状态管理
├── pages/               # 页面和API路由
├── styles/              # 样式文件
├── data/                # SQLite数据库文件（运行后自动创建）
├── middleware.ts        # 路由中间件
├── package.json         # 项目依赖配置
└── DEPLOYMENT.md        # 部署文档
```

---

## 📝 默认登录账号

```
邮箱: admin@qq.com
密码: 123456
```

首次登录会强制要求修改密码。

---

## ✅ 验证安装成功

1. 启动项目后访问 `http://localhost:3000`
2. 使用默认账号登录
3. 尝试访问「入职名单」页面，能正常显示即配置成功

---

## 📞 技术支持

如果遇到任何问题，可以：
1. 查看命令行输出的错误信息
2. 检查浏览器开发者工具的控制台
3. 确认所有依赖已正确安装