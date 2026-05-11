import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist-file');
const indexPath = path.join(rootDir, 'index.html');
const esbuildBinary = process.platform === 'win32'
  ? path.join(rootDir, 'node_modules', '@esbuild', 'win32-x64', 'esbuild.exe')
  : path.join(rootDir, 'node_modules', '.bin', 'esbuild');

function ensureFreshDir(dirPath) {
  rmSync(dirPath, { recursive: true, force: true });
  mkdirSync(dirPath, { recursive: true });
}

function copyDirIfPresent(sourceRelative, targetRelative) {
  const sourcePath = path.join(rootDir, sourceRelative);
  const targetPath = path.join(distDir, targetRelative);
  if (!existsSync(sourcePath)) {
    throw new Error(`Missing required path: ${sourceRelative}`);
  }
  copyRecursive(sourcePath, targetPath);
}

function copyRecursive(sourcePath, targetPath) {
  const stat = lstatSync(sourcePath);
  if (stat.isDirectory()) {
    mkdirSync(targetPath, { recursive: true });
    for (const entry of readdirSync(sourcePath)) {
      copyRecursive(path.join(sourcePath, entry), path.join(targetPath, entry));
    }
    return;
  }

  mkdirSync(path.dirname(targetPath), { recursive: true });
  copyFileSync(sourcePath, targetPath);
}

function sanitizeCorruptedHtml(html) {
  return html
    .replace(
      /<meta name="description"[\s\S]*?<meta name="author" content="CET46 Engine Team">/,
      [
        '<meta name="description" content="基于FSRS 4.5算法的科学记忆系统，支持CET-4/6词汇学习与本地同步">',
        '<meta name="keywords" content="CET4,CET6,英语,背单词,FSRS,科学记忆,间隔重复,词汇学习">',
        '<meta name="author" content="CET46 Engine Team">'
      ].join('\n  ')
    )
    .replace(
      /<meta property="og:type" content="website">[\s\S]*?<meta name="twitter:image" content="icons\/icon-512\.svg">/,
      [
        '<meta property="og:type" content="website">',
        '<meta property="og:title" content="CET46 科学记忆引擎 Pro v1.3.6">',
        '<meta property="og:description" content="基于FSRS 4.5算法的科学记忆系统，支持CET-4/6词汇学习与本地同步">',
        '<meta property="og:image" content="icons/icon-512.svg">',
        '<meta property="og:url" content="https://cet46.app">',
        '<meta property="og:locale" content="zh_CN">',
        '<meta property="og:site_name" content="CET46引擎">',
        '',
        '<meta name="twitter:card" content="summary_large_image">',
        '<meta name="twitter:title" content="CET46 科学记忆引擎 Pro v1.3.6">',
        '<meta name="twitter:description" content="基于FSRS 4.5算法的科学记忆系统">',
        '<meta name="twitter:image" content="icons/icon-512.svg">'
      ].join('\n  ')
    )
    .replace(
      /<div style="display: flex; align-items: center; gap: 8px;">[\s\S]*?<\/div>\s*<\/div>\s*<h1>/,
      [
        '<div style="display: flex; align-items: center; gap: 8px;">',
        '  <button class="theme-toggle" data-action="toggle-theme" aria-label="切换主题" title="切换主题">主题</button>',
        '  <span id="offline-indicator" data-action="show-resource-status" role="button" tabindex="0" style="font-size: 0.9rem; cursor: help;" title="资源状态" aria-label="资源状态">资源</span>',
        '  <span id="network-status-dot" data-action="show-network-status" role="button" tabindex="0" class="status-online" title="网络状态" aria-label="网络状态"></span>',
        '  <button class="theme-toggle" data-action="show-shortcut-guide" aria-label="快捷键指南" title="快捷键指南">快捷键</button>',
        '</div>',
        '</div>',
        '<h1>'
      ].join('\n        ')
    )
    .replace(/<span id="engine-fuel-label">[\s\S]*?<\/span>\s*<span>[\s\S]*?<\/span>/, '<span id="engine-fuel-label">燃料 20%</span>\n                <span>⛽</span>')
    .replace(/<span id="engine-heat-label">[\s\S]*?<\/span>\s*<span>[\s\S]*?<\/span>/, '<span id="engine-heat-label">温度 0%</span>\n                <span>🔥</span>')
    .replace(/<div class="engine-status-text status-text" id="engine-status-text">[\s\S]*?<\/div>/, '<div class="engine-status-text status-text" id="engine-status-text">引擎待机中</div>')
    .replace(/<button class="btn btn-primary start-btn primary-btn" id="start-btn"[\s\S]*?<\/button>/, '<button class="btn btn-primary start-btn primary-btn" id="start-btn" data-action="start-study" style="width: 100%;" aria-label="开始学习">开始学习</button>')
    .replace(/<button class="btn btn-primary" id="wrong-study-btn"[\s\S]*?<\/button>/, '<button class="btn btn-primary" id="wrong-study-btn" data-action="study-wrong" style="width: 100%;" aria-label="开始专项复习错题">专项复习错题</button>')
    .replace(/<div id="error-analysis-panel"[\s\S]*?role="region" aria-label="[^"]*>/, '<div id="error-analysis-panel" style="background: var(--card-bg); border-radius: 12px; padding: 1rem; margin-bottom: 1rem; border: 1px solid var(--sv-border-dark);" role="region" aria-label="错误病理分析">')
    .replace(/title="([^"]*?)\s+aria-label="/g, 'title="$1" aria-label="')
    .replace(/placeholder="([^"]*?)\s+style=/g, 'placeholder="$1" style=')
    .replace(/aria-label="([^"]*?)\s+style=/g, 'aria-label="$1" style=')
    .replace(/aria-label="([^"]*?)>/g, 'aria-label="$1">')
    .replace(/\?\/(span|div|button|kbd|label|option|h3|textarea)/g, '</$1')
    .replace(/<h3 style="font-size: 0\.95rem; margin-bottom: 0\.8rem; color: var\(--text-color\);">WebDAV[\s\S]*?<\/h3>/, '<h3 style="font-size: 0.95rem; margin-bottom: 0.8rem; color: var(--text-color);">WebDAV 云同步</h3>')
    .replace(/>绠楁硶瀹為獙瀹?<\/h3>/g, '>算法实验室</h3>')
    .replace(/>鏈湴鏁版嵁绠＄悊<\/h3>/g, '>本地数据管理</h3>');
}

function rewriteHtml(originalHtml) {
  return sanitizeCorruptedHtml(originalHtml)
    .replace(
      /<link\s+rel="preload"\s+href="js\/main\.js"\s+as="script"\s+crossorigin>\s*/i,
      ''
    )
    .replace(
      /<script\s+type="module"\s+src="\.\/js\/main\.js"><\/script>/i,
      '<script defer src="./js/main.bundle.js"></script>'
    );
}

function loadHtmlTemplate() {
  return readFileSync(indexPath, 'utf8');
}

function buildBundle() {
  if (!existsSync(esbuildBinary)) {
    throw new Error('Missing esbuild binary. Run npm install before npm run build:file.');
  }

  execFileSync(
    esbuildBinary,
    [
      path.join(rootDir, 'js', 'main.js'),
      '--bundle',
      '--format=iife',
      '--platform=browser',
      '--target=es2020',
      `--outfile=${path.join(distDir, 'js', 'main.bundle.js')}`,
    ],
    {
      cwd: rootDir,
      stdio: 'inherit',
    }
  );
}

function main() {
  ensureFreshDir(distDir);
  mkdirSync(path.join(distDir, 'js'), { recursive: true });
  buildBundle();

  copyDirIfPresent('css', 'css');
  copyDirIfPresent('assets', 'assets');
  copyDirIfPresent('icons', 'icons');

  const html = loadHtmlTemplate();
  const rewrittenHtml = rewriteHtml(html);
  writeFileSync(path.join(distDir, 'index.html'), rewrittenHtml, 'utf8');

  console.log('Built file-openable bundle at dist-file/index.html');
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
