/**
 * 输入框文字 → 核心单位数值（元 / 个 / 百分数）。
 * 带「万」「亿」后缀时按字面换算成元，与字段默认单位无关。
 */

export type Unit = "yuan" | "wan" | "count" | "percent";
export type ParseError = "empty" | "invalid" | "negative" | "too-large";
export type Parsed = { ok: true; value: number } | { ok: false; error: ParseError };

// 核心单位下的上限：金额 1000 亿元，孩子 20 个，收益率 10%
const LIMIT: Record<Unit, number> = { yuan: 1e11, wan: 1e11, count: 20, percent: 10 };

// 千分位必须三位一组，「1,5」判为非法而不是猜成 15
const NUMBER = /^(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?$/;

export function parseInput(text: string, unit: Unit): Parsed {
  let s = toHalfWidth(text).replace(/\s+/g, "");
  if (s === "") return { ok: false, error: "empty" };

  const negative = s.startsWith("-");
  if (negative) s = s.slice(1);

  let scale = unit === "wan" ? 1e4 : 1;
  const suffix = s.at(-1);
  if (suffix === "万" || suffix === "亿") {
    if (unit !== "yuan" && unit !== "wan") return { ok: false, error: "invalid" };
    s = s.slice(0, -1);
    scale = suffix === "万" ? 1e4 : 1e8;
  } else if (suffix === "%" && unit === "percent") {
    s = s.slice(0, -1);
  } else if (suffix === "元" && unit === "yuan") {
    s = s.slice(0, -1);
  }

  if (!NUMBER.test(s)) return { ok: false, error: "invalid" };
  const n = Number(s.replace(/,/g, ""));
  if (unit === "count" && !Number.isInteger(n)) return { ok: false, error: "invalid" };
  // 先乘再四舍五入到分，避免 1.1 × 10000 得到 11000.000000000002
  const value = Math.round(n * scale * 100) / 100;
  if (negative && value !== 0) return { ok: false, error: "negative" };
  if (value > LIMIT[unit]) return { ok: false, error: "too-large" };
  return { ok: true, value };
}

export const PARSE_MESSAGE: Record<ParseError, string> = {
  empty: "",
  invalid: "请输入数字",
  negative: "不能是负数",
  "too-large": "数字太大了",
};

function toHalfWidth(s: string): string {
  return s.replace(/[０-９．，－％]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
}
