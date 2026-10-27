/**
 * 小Lin说财富自由 · 计算核心（纯函数，无 DOM）
 * 公式：财富自由临界值 = 12 / r × 月开销 + 孩子 + 医疗 + 住房；金额一律用元
 */

type NumLike = number | string | null | undefined;

export interface FreedomInput {
  /** 月开销，必填 */
  X: NumLike;
  /** 实际净收益率百分比（已扣通胀），默认 2.5 */
  rPct?: NumLike;
  /** 单孩成本 */
  K?: NumLike;
  /** 孩子数（整数） */
  N?: NumLike;
  /** 医疗储备 */
  M?: NumLike;
  /** 购房全款 */
  H?: NumLike;
  /** 已有可投资资产 */
  A?: NumLike;
  /** 月储蓄 */
  S?: NumLike;
}

type Field = keyof FreedomInput;

export interface FreedomOk {
  ok: true;
  X: number;
  rPct: number;
  multiplier: number;
  annual: number;
  daily: number;
  kids: number;
  M: number;
  H: number;
  A: number;
  S: number;
  target: number;
  gap: number;
  covered: boolean;
  /** A − kids − M − H；= 0 刚好用完，< 0 预留都不够 */
  free: number;
  maxX: number;
  yearsNeeded: number | null;
  fire4: number;
  fire35: number;
  fire3: number;
  fire34: number;
}

export type FreedomResult =
  | FreedomOk
  | { ok: false; reason: "invalid-input"; field: Field }
  | { ok: false; reason: "non-positive-real-return" };

const OPTIONAL = ["K", "N", "M", "H", "A", "S"] as const;

export function calcFreedom(p: FreedomInput): FreedomResult {
  const v = validate(p);
  if (!v.ok) return v;
  const { X, rPct, K, N, M, H, A, S } = v.values;

  // 实际收益 ≤ 0 时本金必然缩水，公式无解；不能偷偷抬成一个小正数
  if (rPct <= 0 && X > 0) return { ok: false, reason: "non-positive-real-return" };

  const multiplier = rPct > 0 ? 12 / (rPct / 100) : 0;
  const annual = X * 12;
  const daily = multiplier * X;
  const kids = K * N;
  const target = daily + kids + M + H;
  const free = A - kids - M - H;

  return {
    ok: true,
    X,
    rPct,
    multiplier,
    annual,
    daily,
    kids,
    M,
    H,
    A,
    S,
    target,
    gap: target - A,
    covered: A >= target,
    free,
    maxX: free > 0 && multiplier > 0 ? free / multiplier : 0,
    yearsNeeded: yearsToGoal(target, A, S, rPct),
    fire4: annual * 25,
    fire35: annual / 0.035,
    fire3: annual * 33,
    fire34: annual * 34,
  };
}

type Values = Record<"X" | "rPct" | (typeof OPTIONAL)[number], number>;

function validate(
  p: FreedomInput,
): { ok: true; values: Values } | { ok: false; reason: "invalid-input"; field: Field } {
  const X = isBlank(p.X) ? NaN : num(p.X);
  if (!(X >= 0) || !Number.isFinite(X)) return invalid("X");

  const rPct = isBlank(p.rPct) ? 2.5 : num(p.rPct);
  if (!Number.isFinite(rPct)) return invalid("rPct");

  const values = { X, rPct } as Values;
  for (const k of OPTIONAL) {
    const n = isBlank(p[k]) ? 0 : num(p[k]);
    if (!(n >= 0) || !Number.isFinite(n)) return invalid(k);
    if (k === "N" && !Number.isInteger(n)) return invalid(k);
    values[k] = n;
  }
  return { ok: true, values };
}

/**
 * 填平缺口需要的年数：已有资产 A 与月存 S 都按实际月利率复利。
 * A·(1+i)^n + S·((1+i)^n − 1)/i = target  →  n = ln((T·i+S)/(A·i+S)) / ln(1+i)
 */
export function yearsToGoal(target: number, assets: number, monthlySave: number, realRatePct: number): number | null {
  if (assets >= target) return 0;
  const i = realRatePct / 100 / 12;
  if (i <= 0) return monthlySave > 0 ? (target - assets) / (monthlySave * 12) : null;
  if (monthlySave <= 0 && assets <= 0) return null;
  return Math.log((target * i + monthlySave) / (assets * i + monthlySave)) / Math.log(1 + i) / 12;
}

function invalid(field: Field) {
  return { ok: false, reason: "invalid-input", field } as const;
}

function isBlank(v: NumLike): v is null | undefined | "" {
  return v === undefined || v === null || v === "";
}

function num(v: number | string): number {
  if (typeof v === "number") return v;
  const s = v.replace(/,/g, "").trim();
  return s === "" ? NaN : Number(s);
}

/** 元 → 展示文本：≥ 1 万用「万」（≥ 1000 万取整并加千分位，否则最多一位小数），否则用「元」 */
export function fmtWan(yuan: number): string {
  if (!Number.isFinite(yuan)) return "—";
  const abs = Math.abs(yuan);
  const sign = yuan < 0 ? "-" : "";
  if (abs >= 10000) {
    const wan = abs / 10000;
    const text = wan >= 1000 ? Math.round(wan).toLocaleString("zh-CN") : String(Math.round(wan * 10) / 10);
    return `${sign}${text} 万`;
  }
  return `${sign}${Math.round(abs).toLocaleString("zh-CN")} 元`;
}
