import { createModuleLoader } from '../utils/module-loader.js';

// 使用字面量动态导入路径，便于打包器静态分析并在构建时改写为对应 chunk 地址。
// 注意：路径相对于本文件（js/init/），即 ../features/settings.js → js/features/settings.js
export const loadSettingsFeature = createModuleLoader(
  () => import('../features/settings.js'),
  'SettingsFeature'
);
export const loadWebDAVFeature = createModuleLoader(
  () => import('../features/webdav.js'),
  'WebDAVFeature'
);
