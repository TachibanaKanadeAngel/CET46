// fsrs-calibration.ts - FSRS 权重校准管同步管理
// 提供权重校验、序列化导入/导出、重置与同步钩子，便于校准结果在设备/社区间迁移。
import { DEFAULT_FSRS_W, getFSRSWeights, setFSRSWeights } from '../fsrs.js';

export const FSRS_WEIGHT_COUNT = 17;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ApplyResult {
  ok: boolean;
  errors?: string[];
  weights?: number[];
}

/** 校验一组 FSRS 权重的合法性（纯函数，不修改任何状态）。 */
export function validateFSRSWeights(weights: unknown): ValidationResult {
  const errors: string[] = [];
  if (!Array.isArray(weights)) {
    return { valid: false, errors: ['权重必须是数组'] };
  }
  if (weights.length !== FSRS_WEIGHT_COUNT) {
    errors.push(`权重数量必须为 ${FSRS_WEIGHT_COUNT}，实际为 ${weights.length}`);
  }
  weights.forEach((w, i) => {
    if (typeof w !== 'number' || !Number.isFinite(w)) {
      errors.push(`第 ${i + 1} 项不是有限数值`);
    } else if (Math.abs(w) > 100) {
      errors.push(`第 ${i + 1} 项超出 [-100, 100] 范围`);
    }
  });
  return { valid: errors.length === 0, errors };
}

/** 将当前生效的 FSRS 权重序列化为紧凑 JSON 字符串，用于导出/分享/备份。 */
export function serializeFSRSWeights(): string {
  return JSON.stringify(getFSRSWeights());
}

/** 将一组原始权重数组序列化为 JSON 字符串（幂等，供外部对象导出）。 */
export function serializeWeights(weights: number[]): string {
  return JSON.stringify(weights);
}

/** 从任意文本（JSON 数组）还原 FSRS 权重并通过 setFSRSWeights 应用。 */
export function applyFSRSWeightsFromText(text: string): ApplyResult {
  if (typeof text !== 'string' || !text.trim()) {
    return { ok: false, errors: ['导入内容为空'] };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return { ok: false, errors: ['JSON 解析失败：' + (e as Error).message] };
  }
  const weights = Array.isArray(parsed) ? parsed : (parsed as { weights?: unknown })?.weights;
  const check = validateFSRSWeights(weights);
  if (!check.valid) {
    return { ok: false, errors: check.errors };
  }
  if (setFSRSWeights(weights as number[])) {
    return { ok: true, weights: getFSRSWeights() };
  }
  return { ok: false, errors: ['权重应用失败'] };
}

/** 重置为内置默认权重，返回是否成功。 */
export function resetFSRSWeights(): boolean {
  return setFSRSWeights([...DEFAULT_FSRS_W]);
}

/** 判断当前是否使用了非内置的自定义权重（用于 UI 显示“已校准”标记）。 */
export function hasCustomFSRSWeights(): boolean {
  const current = getFSRSWeights();
  if (current.length !== DEFAULT_FSRS_W.length) return true;
  return current.some((w, i) => w !== DEFAULT_FSRS_W[i]);
}