/**
 * 在 Node CommonJS 上下文中加载小程序模块并即时解析 .ts / .js。
 * 小程序 utils 已由 .js 迁移为 .ts，此处统一提供扩展名回退与 TS 转译，
 * 同时保留旧版测试依赖的 API（options.wx / options.console / createPage / assert）。
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');

const ROOT = path.resolve(__dirname, '..');

function resolveModulePath(baseDir, relativePath) {
  const ext = path.extname(relativePath);
  const noExt = ext ? relativePath.slice(0, -ext.length) : relativePath;
  const candidates = [
    relativePath,
    noExt + '.ts',
    noExt + '.js',
    noExt + '.cjs',
    path.join(relativePath, 'index.ts'),
    path.join(relativePath, 'index.js'),
  ];
  for (const cand of candidates) {
    const full = path.resolve(baseDir, cand);
    if (fs.existsSync(full) && fs.statSync(full).isFile()) return full;
  }
  return path.resolve(baseDir, noExt + '.ts');
}

function loadCommonJS(relativePath, options = {}) {
  const overrides = options.moduleOverrides || {};
  if (overrides[relativePath]) return overrides[relativePath];

  let fullPath = resolveModulePath(ROOT, relativePath);
  if (overrides[fullPath]) return overrides[fullPath];

  const rawCode = fs.readFileSync(fullPath, 'utf8');
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

  const localRequire = id => {
    if (!id.startsWith('.')) return require(id);
    let resolved = resolveModulePath(path.dirname(fullPath), id);
    const override = overrides[resolved] || overrides[path.relative(ROOT, resolved)];
    if (override) return override;
    return loadCommonJS(path.relative(ROOT, resolved), options);
  };
  localRequire.async = id => {
    if (typeof options.requireAsync === 'function') {
      return options.requireAsync(id, fullPath);
    }
    return Promise.resolve(localRequire(id));
  };

  const context = vm.createContext({
    module,
    exports: module.exports,
    require: localRequire,
    console: options.console || console,
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
    Symbol,
    Proxy,
    isNaN,
    parseInt,
    parseFloat,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    wx: options.wx || global.wx,
    App: options.App || global.App,
    Page: options.Page || global.Page,
    Component: options.Component || global.Component,
    getApp: options.getApp || global.getApp,
    getCurrentPages: options.getCurrentPages || global.getCurrentPages || (() => [{}]),
  });
  vm.runInContext(code, context, { filename: fullPath });
  return module.exports;
}

function assert(condition, message) {
  if (!condition) throw new Error(`ASSERT FAILED: ${message}`);
}

function createPage(relativePath, options = {}) {
  let definition = null;
  const Page = value => { definition = value; };
  loadCommonJS(relativePath, { ...options, Page });
  assert(definition, `${relativePath} 应注册 Page`);

  const page = {
    data: JSON.parse(JSON.stringify(definition.data || {})),
    setData(update) {
      for (const [key, value] of Object.entries(update)) {
        const match = key.match(/^(\w+)\[(\d+)\]$/);
        if (match) {
          if (!Array.isArray(this.data[match[1]])) this.data[match[1]] = [];
          this.data[match[1]][Number(match[2])] = value;
        } else {
          this.data[key] = value;
        }
      }
    },
  };
  for (const [key, value] of Object.entries(definition)) {
    if (key !== 'data') page[key] = typeof value === 'function' ? value.bind(page) : value;
  }
  return page;
}

module.exports = { ROOT, loadCommonJS, createPage, assert };