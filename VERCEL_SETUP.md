# Vercel 自动部署设置指南

## 概述

配置完成后，每次推送代码到 GitHub 的 main 分支，会自动部署到 Vercel。

## 设置步骤

### 第一步：获取 Vercel Token

1. 访问 https://vercel.com/dashboard
2. 登录您的账号（GitHub 登录）
3. 点击右上角头像 → "Settings"
4. 左侧菜单选择 "Tokens"
5. 点击 "Create Token"
6. 输入名称："GitHub Actions"
7. 点击 "Create"
8. **复制生成的 Token**（只显示一次！）

### 第二步：获取 Vercel Project ID

1. 在 Vercel Dashboard 创建新项目（或已有项目）
2. 进入项目设置 → "General"
3. 找到 "Project ID"，**复制这个 ID**
4. 找到 "Organization ID"（在个人设置里），**复制这个 ID**

### 第三步：在 GitHub 设置 Secrets

1. 打开您的 GitHub 仓库
2. 点击 "Settings" → "Secrets and variables" → "Actions"
3. 点击 "New repository secret"
4. 添加以下三个 Secret：

| Secret 名称 | 值 |
|------------|-----|
| `VERCEL_TOKEN` | 第一步复制的 Token |
| `VERCEL_ORG_ID` | 第二步复制的 Organization ID |
| `VERCEL_PROJECT_ID` | 第二步复制的 Project ID |

### 第四步：推送代码触发部署

```bash
git add .
git commit -m "Setup Vercel auto deploy"
git push origin main
```

### 第五步：查看部署结果

1. 打开 GitHub 仓库 → "Actions" 标签
2. 查看 "Deploy to Vercel" 工作流运行状态
3. 成功后，访问 Vercel 提供的网址

## 手机 PWA 安装

部署成功后：

1. 手机浏览器访问 Vercel 网址（如 `https://cet46-pro-xxx.vercel.app`）
2. 浏览器菜单 → "添加到主屏幕"
3. 桌面出现 "CET46 科学记忆引擎" 图标
4. 点击即可像 App 一样使用！

## 自动部署触发条件

- ✅ 推送到 `main` 或 `master` 分支
- ✅ 创建 Pull Request 到 `main` 或 `master` 分支

每次代码更新后，约 2-3 分钟自动完成部署。
