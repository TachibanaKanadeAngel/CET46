# CET46 打包指南

本指南帮助您将 CET46 打包成 Android APK 和 Windows EXE 可执行文件。

---

## 准备工作

### 安装依赖

```bash
npm install
```

---

## 一、打包 Android APK

### 前置要求
- 安装 [Android Studio](https://developer.android.com/studio)
- 配置 Android SDK
- 安装 Java JDK 11 或更高版本

### 步骤

#### 1. 初始化 Capacitor（只需执行一次）
```bash
npx cap init CET46Pro com.cet46.app --web-dir dist
```

#### 2. 添加 Android 平台（只需执行一次）
```bash
npx cap add android
```

#### 3. 构建并同步
```bash
npm run build
npx cap sync android
```

#### 4. 打开 Android Studio
```bash
npx cap open android
```

#### 5. 在 Android Studio 中打包
- 选择 **Build** → **Generate Signed Bundle / APK**
- 选择 **APK**
- 创建或选择密钥库（keystore）
- 选择 release 版本
- 点击 **Finish**

APK 文件将生成在：`android/app/release/app-release.apk`

### 快捷命令
```bash
# 一键构建（需要配置好环境）
npm run build:apk
```

---

## 二、打包 Windows EXE

### 前置要求
- Windows 操作系统
- 无需额外安装，使用 electron-builder

### 步骤

#### 1. 安装 Electron 依赖（只需执行一次）
```bash
npm install electron electron-builder --save-dev
```

#### 2. 构建应用
```bash
npm run build
```

#### 3. 打包 EXE
```bash
npx electron-builder --win
```

### 输出文件
打包完成后，在 `release` 目录下会生成：
- `CET46 科学记忆引擎 Setup 1.0.0.exe` - 安装程序
- `CET46-Portable-1.0.0.exe` - 便携版（无需安装）

### 快捷命令
```bash
# 一键构建
npm run build:exe
```

---

## 三、文件说明

### 新增文件
| 文件 | 说明 |
|------|------|
| `capacitor.config.json` | Capacitor 配置文件（Android） |
| `electron/main.js` | Electron 主进程 |
| `electron/preload.js` | Electron 预加载脚本 |
| `electron-builder.json` | Electron 打包配置 |
| `BUILD_GUIDE.md` | 本指南 |

### 修改的文件
| 文件 | 修改内容 |
|------|----------|
| `package.json` | 添加打包脚本和依赖 |

---

## 四、分发应用

### APK 分发
- 直接分享 `.apk` 文件
- 上传到应用商店（需要签名）
- 通过二维码分享下载链接

### EXE 分发
- 分享安装程序给用户
- 便携版可以直接运行，无需安装
- 可以上传到软件下载站

---

## 五、常见问题

### Q: Android 打包失败？
A: 检查：
1. Android Studio 是否安装
2. SDK 路径是否正确配置
3. Java 版本是否 >= 11

### Q: EXE 打包后无法运行？
A: 检查：
1. 是否先执行了 `npm run build`
2. `dist` 目录是否存在且包含完整文件
3. 图标文件是否存在

### Q: 如何更新应用？
A: 
- 修改代码后重新打包
- 版本号在 `package.json` 中修改
- 用户下载新版本安装即可

---

## 六、自动化构建（可选）

可以使用 GitHub Actions 自动构建：

```yaml
# .github/workflows/build.yml
name: Build Apps
on: [push]
jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build:exe
```

更多配置请参考官方文档。
