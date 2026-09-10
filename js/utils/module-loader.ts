import logger from './logger.js';

interface ModuleLoaderOptions {
  timeout?: number;
  onLoad?: (mod: unknown) => void;
}

type LoadFunction = (() => Promise<unknown>) & { get: () => unknown };

/**
 * 创建动态模块加载器 - 支持缓存、并发控制和错误处理
 * 消除 loadSettingsFeature / loadWebDAVFeature 等函数的重复逻辑
 *
 * @param loader - 动态导入函数（内部必须使用字面量路径，便于打包器静态分析并在构建时改写为对应 chunk 地址）
 * @param exportName - 需要导出的属性名
 * @param options - 配置选项
 */
export function createModuleLoader(
  loader: () => Promise<Record<string, unknown>>,
  exportName: string,
  options: ModuleLoaderOptions = {}
): LoadFunction {
  const { timeout = 30000, onLoad = null } = options;
  let cachedModule: unknown = null;
  let loadError: unknown = null;
  let pendingLoad: Promise<unknown> | null = null;

  function withTimeout(promise: Promise<unknown>): Promise<unknown> {
    return Promise.race<unknown>([
      promise,
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`模块 ${exportName} 加载超时`)), timeout);
      }),
    ]);
  }

  async function loadModule(): Promise<unknown> {
    if (cachedModule) return cachedModule;
    if (loadError) throw loadError;

    if (pendingLoad) {
      return withTimeout(pendingLoad);
    }

    pendingLoad = (async () => {
      try {
        // loader 内部使用字面量动态导入，Vite/Rollup 可静态分析并在构建时改写为 chunk 地址
        const module = await loader();
        cachedModule = module[exportName];
        logger.info(`[ModuleLoader] ${exportName} 加载完成`);
        if (onLoad) onLoad(cachedModule);
        return cachedModule;
      } catch (err) {
        loadError = err;
        throw err;
      } finally {
        pendingLoad = null;
      }
    })();

    return withTimeout(pendingLoad);
  }

  const result = loadModule as LoadFunction;
  result.get = () => cachedModule;

  return result;
}
