/**
 * 在 Node CommonJS 上下文中加载小程序 .js / .ts 模块
 * 用于绕过项目根 package.json 的 "type": "module" 设置并支持 TypeScript 即时解析
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');

function resolveModulePath(baseDir, relativePath) {
  const normalized = relativePath.endsWith('.js') || relativePath.endsWith('.ts')
    ? relativePath.slice(0, -3)
    : relativePath;

  const candidates = [
    relativePath,
    normalized + '.ts',
    normalized + '.js',
    normalized + '.cjs',
    path.join(normalized, 'index.ts'),
    path.join(normalized, 'index.js'),
  ];
  for (const cand of candidates) {
    const full = path.resolve(baseDir, cand);
    if (fs.existsSync(full) && fs.statSync(full).isFile()) {
      return full;
    }
  }
  return path.resolve(baseDir, relativePath);
}

function loadCommonJS(filePath) {
  let fullPath = resolveModulePath(__dirname, filePath);
  let rawCode = fs.readFileSync(fullPath, 'utf8');
  let code = rawCode;
  if (fullPath.endsWith('.ts')) {
    code = ts.transpileModule(rawCode, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
      },
    }).outputText;
  }

  const module = { exports: {} };
  const context = vm.createContext({
    module,
    exports: module.exports,
    require: (id) => {
      if (id.startsWith('.')) {
        const resolved = resolveModulePath(path.dirname(fullPath), id);
        return loadCommonJS(path.relative(__dirname, resolved));
      }
      return require(id);
    },
    console,
    Math,
    Date,
    JSON,
    Object,
    Array,
    Number,
    String,
    Boolean,
    RegExp,
    Error,
    Set,
    Map,
    Promise,
    Proxy,
    Symbol,
    isNaN,
    parseFloat,
    parseInt,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    global,
    wx: global.wx,
    __wxConfig: global.__wxConfig,
    Page: global.Page,
    App: global.App,
    getApp: global.getApp,
    Component: global.Component,
    getCurrentPages: global.getCurrentPages || (() => []),
  });
  vm.runInContext(code, context, { filename: fullPath });
  return module.exports;
}

module.exports = { loadCommonJS, resolveModulePath };
