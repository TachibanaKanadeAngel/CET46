# CET46 科学记忆引擎 Pro

基于 FSRS 4.5 算法的智能英语单词记忆系统，支持 CET-4/6 词汇学习。

## 功能特性

- **FSRS 4.5 记忆算法** - 先进的间隔重复算法，科学安排复习时间
- **PWA 离线支持** - 可离线使用，支持安装到桌面
- **WebDAV 多设备同步** - 数据云端同步，多设备无缝切换
- **语义干扰分析** - 智能避免相似词同时复习，减少混淆
- **拼写练习** - 多种练习模式（释义/音标/音频）
- **错题本** - 错误分析与专项练习
- **学习统计** - 热力图、进度预估、记忆曲线
- **音频发音** - 有道词典发音支持

## 词库信息

- 总词汇量：6,662 个
- CET-4 核心词汇
- CET-6 核心词汇
- 全部包含 IPA 音标

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 生产构建

```bash
npm run build
```

### 预览构建结果

```bash
npm run preview
```

### 运行测试

```bash
npm run test
```

## 项目结构

```
CET46/
├── css/
│   └── styles.css          # 样式文件
├── icons/                   # PWA 图标
├── js/
│   ├── data/
│   │   └── default_vocab.js # 默认词库
│   ├── features/
│   │   ├── review.js       # 复习功能
│   │   ├── settings.js     # 设置功能
│   │   ├── spelling.js     # 拼写练习
│   │   ├── study.js        # 学习功能
│   │   └── webdav.js       # WebDAV 同步
│   ├── workers/
│   │   ├── semantic-worker.js  # 语义分析 Worker
│   │   └── vocab-worker.js     # 词库处理 Worker
│   ├── config.js           # 配置
│   ├── core.js             # 核心逻辑
│   ├── main.js             # 主入口
│   ├── network.js          # 网络模块
│   ├── state.js            # 状态管理
│   ├── sync.js             # 同步模块
│   └── ui.js               # UI 模块
├── index.html              # 入口页面
├── manifest.json           # PWA 清单
├── sw.js                   # Service Worker
├── package.json            # 项目配置
├── vite.config.js          # Vite 配置
└── vitest.config.js        # 测试配置
```

## 技术栈

- **前端框架**: 原生 JavaScript (ES Module)
- **构建工具**: Vite 5
- **PWA**: vite-plugin-pwa + Workbox
- **测试**: Vitest
- **代码规范**: ESLint + Prettier
- **记忆算法**: FSRS 4.5

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `空格` | 翻转卡片 |
| `←` | 标记为不认识 |
| `→` | 标记为认识 |
| `S` | 拼写练习 |
| `Ctrl+Z` | 撤销操作 |

## 许可证

MIT License
