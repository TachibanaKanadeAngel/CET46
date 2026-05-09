# CET46 科学记忆引擎 Pro

基于 FSRS（Free Spaced Repetition Scheduler）思想的四六级英语单词科学记忆工具。通过间隔重复算法帮助学习者高效记忆 CET-4 / CET-6 核心词汇。

## 功能列表

- **学习** — 新词学习，支持"认识/不认识"快速标记
- **复习** — 基于 FSRS 4.5 算法的间隔重复复习
- **拼写** — 单词拼写练习模式
- **错词** — 错词本，集中攻克薄弱词汇
- **统计** — 学习进度与记忆热力图可视化
- **WebDAV 同步** — 可选的云端备份与同步
- **PWA** — 支持离线访问，可安装到桌面
- **Electron** — 桌面端打包（Windows）
- **Capacitor** — Android APK 打包

## 技术栈

| 层级 | 技术 |
|------|------|
| 构建 | Vite 5 |
| 前端 | Vanilla JavaScript (ES Modules) |
| 存储 | IndexedDB (本地进度) |
| 云同步 | WebDAV 协议 |
| 桌面端 | Electron 28 |
| 移动端 | Capacitor 5 |
| 算法 | FSRS 4.5 间隔重复 |

## 本地运行

```bash
npm install
npm run dev
```

浏览器打开 `http://localhost:3000`。

## 构建

```bash
npm run build          # Web 构建（输出到 dist/）
npm run build:file     # 单文件 HTML 构建（输出到 dist-file/）
npm run build:exe      # Electron Windows 安装包
```

Electron 桌面端相关文件位于 `electron/` 目录，配置在 `electron-builder.json`。

## 数据说明

- **本地存储**：学习进度、错词记录、热力图数据均保存在浏览器 IndexedDB（`CET46_DB`）中，无需登录即可使用。
- **云同步**：通过 WebDAV 协议将数据备份到个人云盘（如坚果云等），为可选功能。在「设置 → WebDAV」中配置后可手动同步。

## 当前版本状态

**v1.3.6-local-stable**：本地学习流程（学习、复习、拼写、错词、统计）已稳定。WebDAV Phase 1.5 同步代码已完成，待真机验收。

## 已知问题

- IDE 内置预览可能出现 Vite HMR WebSocket 报错（`failed to connect to websocket`），不影响业务功能。
- 无 WebDAV 账号时无法验收云同步功能。
- 部分例句字段为空（待后续补全）。

## 安全提示

不要将以下内容提交到仓库：

- WebDAV 用户名 / 密码 / Token
- 密钥文件（keystore、.jks）
- `.env` 环境变量文件
- 任何包含个人账号信息的配置

## 路线图

- **WebDAV Phase 2** — 增量同步、冲突解决、自动备份
- **测试覆盖** — 单元测试与集成测试
- **UI 整理** — 面板布局优化、移动端适配改进
- **FSRS 校准** — 根据用户数据调优算法参数