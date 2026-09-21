import { db } from '../db.js';
import { memoryCache } from '../store.js';
import * as SyncService from '../sync.js';
import {
  decryptWebDAVCredentials,
  clearWebDAVPlaintextCredentials,
  saveWebDAVConfig,
  testWebDAVConnection,
  syncToWebDAV,
  syncFromWebDAV,
  exportEncryptionKey,
  updateWebDAVStatus,
} from '../sync.js';
import { CONFIG } from '../config.js';
import { UI } from '../ui.js';
import logger from '../utils/logger.js';

const getWebdavConfig = (): any => (SyncService as any).webdavConfig;

// 设备ID：使用crypto.randomUUID()生成唯一标识，持久化存储
const DEVICE_ID_KEY = CONFIG.STORAGE_KEYS.DEVICE_ID;
let fallbackDeviceId: string | null = null;

function getDeviceId(): string {
  let id: string | null = null;
  try {
    id = localStorage.getItem(DEVICE_ID_KEY);
  } catch {
    // localStorage 不可用（隐私模式/禁用存储），使用内存 fallback
    if (!fallbackDeviceId) {
      fallbackDeviceId = 'pwa-' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
    }
    return fallbackDeviceId;
  }
  if (!id) {
    id = 'pwa-' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
    try { localStorage.setItem(DEVICE_ID_KEY, id); } catch { /* ignore */ }
  }
  return id;
}

// SSRF 防护：基于二进制 CIDR 匹配的强校验
// 安全原则：解析失败或无法判断时返回 true（拒绝），fail-closed
// 覆盖：IPv4 十进制/八进制/十六进制、IPv6（含 IPv4-mapped）、CGNAT、链路本地、组播等

// IPv4 私有/保留 CIDR 列表（[IP 高32位, 掩码位数]）
const IPV4_RESERVED: [number, number][] = [
  [0x00000000, 8],   // 0.0.0.0/8       "本机网络"
  [0x0A000000, 8],   // 10.0.0.0/8      RFC1918 A 类私有
  [0x7F000000, 8],   // 127.0.0.0/8     回环
  [0x64400000, 10],  // 100.64.0.0/10   RFC6598 CGNAT
  [0xA9FE0000, 16],  // 169.254.0.0/16  链路本地
  [0xAC100000, 12],  // 172.16.0.0/12   RFC1918 B 类私有
  [0xC0A80000, 16],  // 192.168.0.0/16  RFC1918 C 类私有
  [0xC0000000, 24],  // 192.0.0.0/24    IETF 协议分配（修正：原 /4 误拦大量公网）
  [0xC0000200, 24],  // 192.0.2.0/24    RFC5737 文档示例
  [0xC6120000, 15],  // 198.18.0.0/15   RFC2544 基准测试
  [0xC6336400, 24],  // 198.51.100.0/24 RFC5737 文档示例
  [0xCB007100, 24],  // 203.0.113.0/24  RFC5737 文档示例
  [0xE0000000, 4],   // 224.0.0.0/4     组播
  [0xF0000000, 4],   // 240.0.0.0/4     保留（含 255.255.255.255 广播）
];

// IPv6 私有/保留 CIDR（[高64位, 低64位, 掩码位数]）
// lo 的 bit 布局：bit 0-15=group5, bit 16-31=group6, bit 32-47=group7, bit 48-63=group8
const IPV6_RESERVED: [bigint, bigint, number][] = [
  [0x0000000000000000n, 0x0000000000000000n, 128], // ::/128 未指定
  [0x0000000000000000n, 0x0000000000000001n, 128], // ::1/128 回环
  [0x0000000000000000n, 0x0000FFFF00000000n, 96],  // ::ffff:0:0/96 IPv4-mapped（IPv4 部分另行递归校验）
  [0x0064FF9B00000000n, 0x0000000000000000n, 96],  // 64:ff9b::/96 知名前缀（含 IPv4）
  [0x0100000000000000n, 0x0000000000000000n, 64],  // 100::/64 丢弃前缀
  [0x2001000000000000n, 0x0000000000000000n, 32],  // 2001::/32 TEREDO
  [0x2001000200000000n, 0x0000000000000000n, 48],  // 2001:2::/48 基准测试
  [0x2001000800000000n, 0x0000000000000000n, 32],  // 2001:8::/32 AS112
  [0x2001002000000000n, 0x0000000000000000n, 28],  // 2001:20::/28 ORCHID
  [0x20010DB800000000n, 0x0000000000000000n, 32],  // 2001:db8::/32 文档示例
  [0x2002000000000000n, 0x0000000000000000n, 16],  // 2002::/16 6to4
  [0xFC00000000000000n, 0x0000000000000000n, 7],   // fc00::/7 唯一本地 ULA
  [0xFE80000000000000n, 0x0000000000000000n, 10],  // fe80::/10 链路本地
  [0xFF00000000000000n, 0x0000000000000000n, 8],   // ff00::/8 组播
];

/**
 * 解析 IPv4 字符串为 32 位无符号整数
 * 支持十进制、八进制（0前缀）、十六进制（0x前缀）、混合形式
 * @param {string} str - IPv4 字符串
 * @returns {number|null} 32 位无符号整数，失败返回 null
 */
function parseIPv4(str: string): number | null {
  const parts = str.split('.');
  if (parts.length !== 4) return null;
  let result = 0;
  for (const part of parts) {
    if (part.length === 0 || part.length > 12) return null;
    let num: number;
    if (/^0[xX][0-9a-fA-F]+$/.test(part)) {
      num = parseInt(part, 16);
    } else if (/^0[0-7]+$/.test(part)) {
      num = parseInt(part, 8);
    } else if (/^[0-9]+$/.test(part)) {
      num = parseInt(part, 10);
    } else {
      return null;
    }
    if (num < 0 || num > 0xFF) return null;
    result = (result << 8) | num;
  }
  return result >>> 0;
}

/**
 * 解析 IPv6 字面量为 128 位 BigInt [hi, lo]
 * 修正：:: 扩展零计数 + IPv4-mapped 后缀位定位
 * @param {string} str - IPv6 字符串（不含方括号）
 * @returns {[bigint, bigint]|null} [高64位, 低64位]，失败返回 null
 */
function parseIPv6(str: string): [bigint, bigint] | null {
  let ipv4Suffix: number | null = null;
  const lastColon = str.lastIndexOf(':');
  if (lastColon !== -1 && str.indexOf('.') !== -1) {
    const possibleV4 = str.slice(lastColon + 1);
    if (possibleV4.split('.').length === 4) {
      ipv4Suffix = parseIPv4(possibleV4);
      if (ipv4Suffix === null) return null;
      str = str.slice(0, lastColon);
    }
  }

  const ipv4Groups = ipv4Suffix !== null ? 2 : 0;
  const totalGroups = 8;

  const rawGroups = str.split(':');
  const expanded: number[] = [];
  let hasDoubleColon = false;

  let explicitGroups = 0;
  for (let i = 0; i < rawGroups.length; i++) {
    if (rawGroups[i] !== '') explicitGroups++;
  }

  for (let i = 0; i < rawGroups.length; i++) {
    if (rawGroups[i] === '') {
      if (i === 0 || i === rawGroups.length - 1) continue;
      if (hasDoubleColon) return null;
      hasDoubleColon = true;
      const zeros = totalGroups - ipv4Groups - explicitGroups;
      for (let j = 0; j < Math.max(0, zeros); j++) expanded.push(0);
    } else {
      if (!/^[0-9a-fA-F]{1,4}$/.test(rawGroups[i])) return null;
      expanded.push(parseInt(rawGroups[i], 16));
    }
  }

  const expected = totalGroups - ipv4Groups;
  if (!hasDoubleColon) {
    if (expanded.length !== expected) return null;
  } else if (expanded.length > expected) {
    return null;
  } else {
    while (expanded.length < expected) expanded.push(0);
  }

  let hi = 0n, lo = 0n;
  for (let i = 0; i < 4; i++) {
    hi = (hi << 16n) | BigInt(expanded[i] || 0);
  }
  for (let i = 4; i < 6; i++) {
    lo = (lo << 16n) | BigInt(expanded[i] || 0);
  }
  if (ipv4Suffix !== null) {
    lo = (lo << 32n) | BigInt(ipv4Suffix >>> 0);
  } else {
    for (let i = 6; i < 8; i++) {
      lo = (lo << 16n) | BigInt(expanded[i] || 0);
    }
  }

  return [hi, lo];
}

/**
 * 检查 IPv4 地址是否在 CIDR 范围内
 */
function ipv4InCidr(ip: number, cidrIp: number, prefixLen: number): boolean {
  if (prefixLen === 0) return true;
  if (prefixLen >= 32) return ip === cidrIp;
  const mask = (0xFFFFFFFF << (32 - prefixLen)) >>> 0;
  return (ip & mask) === (cidrIp & mask);
}

/**
 * 检查 IPv6 地址是否在 CIDR 范围内
 */
function ipv6InCidr(ipHi: bigint, ipLo: bigint, cidrHi: bigint, cidrLo: bigint, prefixLen: number): boolean {
  if (prefixLen === 0) return true;
  if (prefixLen <= 64) {
    if (prefixLen === 64) return ipHi === cidrHi;
    const mask = (0xFFFFFFFFFFFFFFFFn << BigInt(64 - prefixLen)) & 0xFFFFFFFFFFFFFFFFn;
    return (ipHi & mask) === (cidrHi & mask);
  }
  if (ipHi !== cidrHi) return false;
  const mask = (0xFFFFFFFFFFFFFFFFn << BigInt(128 - prefixLen)) & 0xFFFFFFFFFFFFFFFFn;
  return (ipLo & mask) === (cidrLo & mask);
}

/**
 * SSRF 防护：检查 URL 主机是否为内网/保留地址
 * 安全原则：解析失败时返回 true（拒绝），防止绕过
 * @param {string} url - 完整 URL
 * @returns {boolean} true 表示应拒绝（内网/保留地址或解析失败）
 */
function isPrivateIP(url: string): boolean {
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return true;
  }

  if (!hostname) return true;
  if (/^localhost$/i.test(hostname)) return true;

  const ipv4 = parseIPv4(hostname);
  if (ipv4 !== null) {
    for (const [cidrIp, prefixLen] of IPV4_RESERVED) {
      if (ipv4InCidr(ipv4, cidrIp, prefixLen)) return true;
    }
    return false;
  }

  let cleanV6 = hostname;
  if (cleanV6.startsWith('[') && cleanV6.endsWith(']')) {
    cleanV6 = cleanV6.slice(1, -1);
  }
  const pctIdx = cleanV6.indexOf('%');
  if (pctIdx !== -1) cleanV6 = cleanV6.slice(0, pctIdx);

  if (cleanV6.includes(':')) {
    const v6 = parseIPv6(cleanV6);
    if (v6 === null) return true;
    const [hi, lo] = v6;

    if (hi === 0n && (lo >> 32n) === 0xFFFFn) {
      const v4Part = Number(lo & 0xFFFFFFFFn);
      for (const [cidrIp, prefixLen] of IPV4_RESERVED) {
        if (ipv4InCidr(v4Part, cidrIp, prefixLen)) return true;
      }
      return false;
    }

    for (const [cidrHi, cidrLo, prefixLen] of IPV6_RESERVED) {
      if (ipv6InCidr(hi, lo, cidrHi, cidrLo, prefixLen)) return true;
    }
    return false;
  }

  return false;
}

let updateStats: any = null;
let renderList: any = null;

function init(config: any): void {
  updateStats = config.updateStats;
  renderList = config.renderList;
}

function toggleWebDAVConfig(): void {
  const configDiv = document.getElementById('webdav-config');
  if (!configDiv) return;
  configDiv.style.display = configDiv.style.display === 'none' ? 'block' : 'none';
}

async function handleSaveWebDAVConfig(): Promise<void> {
  const urlEl = document.getElementById('webdav-url') as HTMLInputElement | null;
  const masterKeyEl = document.getElementById('webdav-master-key') as HTMLInputElement | null;
  const usernameEl = document.getElementById('webdav-username') as HTMLInputElement | null;
  const passwordEl = document.getElementById('webdav-password') as HTMLInputElement | null;
  const autoSyncEl = document.getElementById('webdav-auto-sync') as HTMLInputElement | null;

  const url = urlEl ? urlEl.value.trim() : '';
  const masterKey = masterKeyEl ? masterKeyEl.value : '';
  const username = usernameEl ? usernameEl.value.trim() : '';
  const password = passwordEl ? passwordEl.value : '';
  const autoSync = autoSyncEl ? autoSyncEl.checked : false;

  if (!url) {
    UI.toast('请输入 WebDAV 服务器地址', 'error');
    return;
  }

  if (!/^https?:\/\//.test(url)) {
    UI.toast('WebDAV 地址必须以 http:// 或 https:// 开头', 'error');
    return;
  }

  try {
    new URL(url);
  } catch (_e) {
    UI.toast('WebDAV 地址格式无效，请输入正确的 URL', 'error');
    return;
  }

  // SSRF防护：拒绝内网地址
  if (isPrivateIP(url)) {
    UI.toast('不允许连接内网地址', 'error');
    return;
  }

  try {
    await saveWebDAVConfig(url, username, password, masterKey, autoSync);
    updateWebDAVStatus('配置已加密保存');
    toggleWebDAVConfig();
  } catch (e: any) {
    UI.toast(e.message, 'error');
  }
}

async function handleTestWebDAVConnection(): Promise<void> {
  const urlEl = document.getElementById('webdav-url') as HTMLInputElement | null;
  const masterKeyEl = document.getElementById('webdav-master-key') as HTMLInputElement | null;
  const usernameEl = document.getElementById('webdav-username') as HTMLInputElement | null;
  const passwordEl = document.getElementById('webdav-password') as HTMLInputElement | null;

  const url = urlEl ? urlEl.value.trim() : '';
  const masterKey = masterKeyEl ? masterKeyEl.value : '';
  let username = usernameEl ? usernameEl.value.trim() : '';
  let password = passwordEl ? passwordEl.value : '';

  if (!url) {
    UI.toast('请先输入 WebDAV 服务器地址', 'warning');
    return;
  }

  // SSRF 防护：与保存配置一致，拒绝内网地址，防止测试连接被用于探测内网
  if (isPrivateIP(url)) {
    UI.toast('不允许连接内网地址', 'error');
    return;
  }

  const currentCfg = getWebdavConfig();
  if (currentCfg && currentCfg.encryptedAuth && !username) {
    if (!masterKey) {
      UI.toast('请输入主密码解密凭证', 'warning');
      return;
    }
    const decrypted = await decryptWebDAVCredentials(masterKey);
    if (!decrypted) {
      UI.toast('主密码错误，无法解密凭证', 'error');
      return;
    }
    username = currentCfg.username;
    password = currentCfg.password;
  }

  if (!username || !password) {
    UI.toast('请输入用户名和密码', 'warning');
    return;
  }

  updateWebDAVStatus('正在测试连接...');

  try {
    await testWebDAVConnection({ url, username, password });
    updateWebDAVStatus('连接成功');
    UI.toast('WebDAV 连接测试成功', 'success');
  } catch (err: any) {
    updateWebDAVStatus('连接失败');
    UI.toast(err.message, 'error');
  } finally {
    clearWebDAVPlaintextCredentials();
  }
}

function handleExportEncryptionKey(): void {
  const keyData = exportEncryptionKey();
  if (!keyData) {
    UI.toast('暂无已加密配置', 'warning');
    return;
  }

  const blob = new Blob([JSON.stringify(keyData)], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'CET46_Identity.key';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  UI.toast('凭证已导出，请妥善保管。', 'success');
}

async function ensureCredentialsReady(): Promise<boolean> {
  const masterKeyInput = document.getElementById('webdav-master-key') as HTMLInputElement | null;
  const masterKey = masterKeyInput ? masterKeyInput.value : '';

  const currentCfg = getWebdavConfig();
  if (!(currentCfg && currentCfg.encryptedAuth && !currentCfg.username)) {
    return true;
  }

  let key: string | null = masterKey;
  if (!key) {
    key = await UI.prompt('解密凭证', '请输入主密码解密 WebDAV 凭证：', '主密码');
    if (!key) return false;
    if (masterKeyInput) masterKeyInput.value = key;
  }

  try {
    const decrypted = await decryptWebDAVCredentials(key);
    if (!decrypted) {
      UI.toast('主密码错误', 'error');
      return false;
    }
  } catch (e: any) {
    logger.warn('[ensureCredentialsReady] 解密凭证失败:', e.message);
    UI.toast('凭证解密失败，请重新配置 WebDAV', 'error');
    return false;
  }

  return true;
}

async function handleSyncToWebDAV(): Promise<void> {
  if (!getWebdavConfig()) {
    UI.toast('请先配置 WebDAV', 'warning');
    toggleWebDAVConfig();
    return;
  }

  if (!(await ensureCredentialsReady())) {
    return;
  }

  await UI.safeExecute(async () => {
    const deviceId = getDeviceId();
    const result = await syncToWebDAV(db, memoryCache, deviceId);
    if (result.status === 'no_changes') {
      updateWebDAVStatus('数据已是最新，无需同步');
    } else {
      updateWebDAVStatus(`增量同步完成：${result.changes} 条变更`);
    }
    if (updateStats) updateStats();
  }, '正在同步到云端...');
}

async function handleSyncFromWebDAV(): Promise<void> {
  if (!getWebdavConfig()) {
    UI.toast('请先配置 WebDAV', 'warning');
    toggleWebDAVConfig();
    return;
  }

  if (!(await ensureCredentialsReady())) {
    return;
  }

  await UI.safeExecute(async () => {
    const deviceId = getDeviceId();
    const result = await syncFromWebDAV(db, memoryCache, deviceId);
    if (result.status === 'success') {
      updateWebDAVStatus('增量同步成功');
      if (updateStats) updateStats();
      if (renderList) renderList();
      UI.toast('数据已增量合并', 'success');
    } else if (result.status === 'needs_full_sync') {
      updateWebDAVStatus('需要全量同步');
      UI.toast('云端数据量更大，建议执行全量同步', 'warning');
    }
  }, '正在从云端恢复数据...');
}

export const WebDAVFeature = {
  init,
  toggleWebDAVConfig,
  handleSaveWebDAVConfig,
  handleTestWebDAVConnection,
  handleExportEncryptionKey,
  handleSyncToWebDAV,
  handleSyncFromWebDAV,
};

export default WebDAVFeature;
