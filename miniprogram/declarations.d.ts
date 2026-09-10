/**
 * 微信小程序全局类型定义补丁
 */

declare const wx: any;
declare const getApp: <T = any>() => T;
declare const getCurrentPages: <T = any>() => T[];
declare const Page: (options: any) => void;
declare const Component: (options: any) => void;
declare const App: (options: any) => void;
declare const require: (id: string) => any;
declare const module: { exports: any };
declare const exports: any;
