# CET46 部署指南

## 概述

CET46 项目支持两种免费部署方式：
1. **GitHub Pages** - 适合国内访问，配置简单
2. **Vercel** - 全球 CDN，访问速度快

---

## 方式一：GitHub Pages 部署（推荐国内用户）

### 步骤 1：启用 GitHub Pages

1. 打开 GitHub 仓库页面：`https://github.com/TachibanaKanadeAngel/CET46`
2. 点击 **Settings**（设置）
3. 左侧菜单选择 **Pages**
4. **Source** 选择 **GitHub Actions**

### 步骤 2：推送代码触发部署

```bash
git add .
git commit -m "添加 GitHub Pages 部署配置"
git push origin main
```

### 步骤 3：查看部署状态

1. 打开 GitHub 仓库页面
2. 点击 **Actions** 标签
3. 查看部署进度

### 步骤 4：访问网站

部署完成后，访问地址：
```
https://tachibanakanadeangel.github.io/CET46/
```

---

## 方式二：Vercel 部署（推荐海外用户）

### 步骤 1：注册 Vercel 账号

1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub 账号登录

### 步骤 2：导入项目

1. 点击 **Add New Project**
2. 选择 **Import Git Repository**
3. 选择 `TachibanaKanadeAngel/CET46`
4. 点击 **Import**

### 步骤 3：配置项目

1. **Framework Preset**: 选择 `Vite`
2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. 点击 **Deploy**

### 步骤 4：访问网站

部署完成后，Vercel 会分配一个域名：
```
https://cet46-pro-xxxx.vercel.app
```

### （可选）绑定自定义域名

1. 在 Vercel 项目设置中选择 **Domains**
2. 添加您的域名
3. 按照提示配置 DNS

---

## 手机安装应用

部署完成后，手机访问网站即可安装 PWA 应用：

### Android (Chrome)
1. 打开网站
2. 点击菜单 → **添加到主屏幕**
3. 点击 **安装**

### iPhone/iPad (Safari)
1. 打开网站
2. 点击分享按钮 → **添加到主屏幕**
3. 点击 **添加**

---

## 自动部署

两种部署方式都支持自动部署：
- 每次推送到 `main` 或 `master` 分支会自动触发部署
- 通常 1-2 分钟内完成

---

## 常见问题

### Q: GitHub Pages 部署失败？
A: 检查仓库 Settings → Pages → Source 是否设置为 GitHub Actions

### Q: Vercel 部署需要配置环境变量？
A: 不需要，项目已配置好 `vercel.json`

### Q: 如何更新网站？
A: 直接推送代码到 GitHub，会自动重新部署

### Q: 手机安装后无法离线使用？
A: 首次访问需要联网，Service Worker 会自动缓存资源

---

## 部署文件说明

| 文件 | 用途 |
|------|------|
| `.github/workflows/github-pages.yml` | GitHub Pages 自动部署配置 |
| `.github/workflows/deploy.yml` | Vercel 自动部署配置 |
| `vercel.json` | Vercel 项目配置 |
| `vite.config.js` | Vite 构建配置（包含 PWA 配置） |
