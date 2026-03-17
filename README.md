# CET46 科学记忆引擎 Pro v1.0

基于 FSRS 4.5 算法的智能英语单词记忆系统，支持 CET-4/6 词汇学习。

## ✨ 功能特性

- 🧠 **FSRS 4.5 记忆算法** - 科学安排复习时间
- 📱 **PWA 离线支持** - 可安装到桌面，离线使用
- ☁️ **WebDAV 同步** - 多设备数据同步
- 🎯 **语义干扰分析** - 避免相似词混淆
- ✍️ **拼写练习** - 多种练习模式
- 📊 **学习统计** - 热力图、进度预估
- 🔊 **音频发音** - 有道词典支持

## 📦 词库信息

- 总词汇量：6,662 个
- CET-4/6 核心词汇
- 包含 IPA 音标

## 🚀 快速部署

### 1. 部署到 Vercel

```bash
# 安装 Vercel CLI
npm install -g vercel

# 部署
vercel --prod
```

### 2. 使用 GitHub Actions

推送到 GitHub 后自动部署

## ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `空格` | 翻转卡片 |
| `←` | 不认识 |
| `→` | 认识 |
| `S` | 拼写练习 |
| `Ctrl+Z` | 撤销 |

## 📂 项目结构

```
CET46/
├── css/           # 样式文件
├── icons/         # PWA 图标
├── js/            # JavaScript 模块
│   ├── features/  # 功能模块
│   ├── utils/     # 工具函数
│   ├── workers/   # Web Workers
│   └── widgets/   # UI 组件
├── index.html     # 入口
├── manifest.json  # PWA 配置
└── sw.js          # Service Worker
```

## 🛠️ 技术栈

- 原生 JavaScript (ES6+)
- FSRS 4.5 算法
- PWA (Service Worker + Manifest)
- IndexedDB (本地存储)
- WebDAV (云端同步)

## 📄 许可证

MIT License
