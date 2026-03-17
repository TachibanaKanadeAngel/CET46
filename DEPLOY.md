# CET46 科学记忆引擎 Pro v1.0 - 部署指南

## 🚀 快速部署到 Vercel

### 1. 准备 GitHub 仓库

1. 在 GitHub 创建新仓库（例如：`cet46-memory-engine`）
2. 将本地代码推送到仓库：
   ```bash
   git init
   git add .
   git commit -m "Initial commit: CET46 Pro v1.0"
   git branch -M main
   git remote add origin https://github.com/你的用户名/cet46-memory-engine.git
   git push -u origin main
   ```

### 2. 部署到 Vercel

#### 方案 A：通过 Vercel 网站（推荐）

1. 访问 https://vercel.com/
2. 点击 "Add New Project"
3. 导入你的 GitHub 仓库
4. 框架预设选择 "Other"
5. 点击 "Deploy"
6. 等待部署完成，获得 `https://your-project.vercel.app` 链接

#### 方案 B：通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署
vercel --prod
```

### 3. 配置自动部署（GitHub Actions）

已在 `.github/workflows/deploy.yml` 配置自动部署。

需要在 GitHub 仓库设置中添加以下 Secrets：

- `VERCEL_TOKEN`：Vercel 个人访问令牌
- `VERCEL_ORG_ID`：Vercel 组织 ID
- `VERCEL_PROJECT_ID`：Vercel 项目 ID

获取方法：
1. 在 Vercel 创建项目后，进入项目设置
2. 找到 "General" → "Project ID"
3. 在 Vercel 账户设置中生成 "Token"

### 4. 安装为 PWA

部署完成后：

**电脑端 (Chrome/Edge)：**
- 访问部署后的 HTTPS 链接
- 地址栏右侧会出现 "安装" 图标（🖥️+⬇️）
- 点击安装，即可在桌面创建独立应用

**手机端 (iOS Safari)：**
- 访问部署后的链接
- 点击分享按钮 → "添加到主屏幕"

**手机端 (Android Chrome)：**
- 访问部署后的链接
- 点击菜单 → "安装应用"

## 🔄 数据同步配置（WebDAV + 坚果云）

### 1. 注册坚果云

1. 访问 https://www.jianguoyun.com/
2. 注册账号并登录

### 2. 开启 WebDAV

1. 进入坚果云 "设置" → "安全选项"
2. 开启 "第三方应用管理"
3. 添加应用密码（生成 16 位密码）

### 3. 在 CET46 中配置

1. 打开 CET46 应用
2. 进入 "设置" → "WebDAV 同步"
3. 填写以下信息：
   - **服务器地址**：`https://dav.jianguoyun.com/dav/`
   - **账号**：你的坚果云注册邮箱
   - **密码**：坚果云生成的应用密码
4. 点击 "测试连接"
5. 开启 "自动同步"

### 4. 同步流程

- **电脑背完**：点击 "同步到云端"
- **手机打开**：点击 "从云端同步"
- 数据会自动加密后上传到坚果云

## 📱 使用建议

1. **每日学习**：手机/平板随时随地背单词
2. **复习提醒**：利用 FSRS 算法，在最佳记忆时间点复习
3. **进度同步**：多设备无缝切换，进度实时同步
4. **离线使用**：PWA 支持离线访问，联网后自动同步

## 🛠️ 技术栈

- **前端**：原生 JavaScript (ES6+), CSS3, HTML5
- **算法**：FSRS 4.5 间隔重复算法
- **存储**：IndexedDB (本地) + WebDAV (云端)
- **部署**：Vercel Edge Network
- **PWA**：Service Worker, Manifest

## 📄 版本信息

- **版本**：v1.0
- **发布日期**：2026-03-17
- **功能**：CET-4/6 词汇学习、FSRS 记忆算法、多设备同步
