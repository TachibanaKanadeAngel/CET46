export const DEFAULT_FSRS_W: readonly number[];
export const DEFAULT_TARGET_RETENTION: number;
export const MS_PER_DAY: number;

export function validateWeights(weights: any): boolean;
export function calculateLevenshtein(s1: string, s2: string): number;
export function calculateFSRSInterval(
  s: number,
  r?: number | null,
  circadianScore?: number,
  msPerDay?: number
): number;
export function calculateForgettingDecay(stability?: number | null, daysSinceReview?: number | null): number;
export function calculateShortTermMemory(
  reps?: number,
  lastReview?: number,
  quality?: number,
  now?: number,
  windowMs?: number
): { reps: number; bonus: number; lastReview: number };
export function applyFuzz(interval: number, msPerDay?: number): number;
export function updateFSRS(
  wd: any,
  quality: number,
  weights?: readonly number[] | number[],
  now?: number,
  msPerDay?: number
): { stability: number; difficulty: number };
