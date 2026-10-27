import { test, expect } from "vitest";
import { calcFreedom, yearsToGoal, fmtWan, type FreedomInput, type FreedomOk } from "../src/core/calc";

const ok = (p: FreedomInput): FreedomOk => {
  const r = calcFreedom(p);
  if (!r.ok) throw new Error(JSON.stringify(r));
  return r as FreedomOk;
};

const tier1 = { X: 15000, rPct: 2.5, K: 1500000, N: 2, M: 1500000, H: 7000000 };
const reverse600 = { X: 0, rPct: 2.5, K: 700000, N: 1, M: 500000, A: 6000000 };

test("月花 1 万：小Lin 480 万，4% 300 万，3% 396 万", () => {
  const r = ok({ X: 10000, rPct: 2.5 });
  expect(r.multiplier).toBe(480);
  expect(r.target).toBe(4800000);
  expect(r.fire4).toBe(3000000);
  expect(r.fire3).toBe(3960000);
});

test("视频例 1：一线中产 1870 万，分项 720/300/150/700 万", () => {
  const r = ok(tier1);
  expect(r.target).toBe(18700000);
  expect([r.daily, r.kids, r.M, r.H]).toEqual([7200000, 3000000, 1500000, 7000000]);
});

test("视频例 2：600 万扣孩 70 万 + 医 50 万 → 每月 1 万", () => {
  const r = ok(reverse600);
  expect(r.free).toBe(4800000);
  expect(r.maxX).toBe(10000);
});

test("资产刚好够时总额精确、无浮点尾差", () => {
  const r = ok({ ...reverse600, X: 10000 });
  expect(r.target).toBe(6000000);
  expect(r.covered).toBe(true);
  expect(r.yearsNeeded).toBe(0);
});

test("预留刚好用完 / 预留超过资产：free 区分，maxX 为 0", () => {
  const equal = ok({ ...reverse600, A: 1200000 });
  expect(equal.free).toBe(0);
  expect(equal.maxX).toBe(0);
  const short = ok({ ...reverse600, A: 1000000 });
  expect(short.free).toBe(-200000);
  expect(short.maxX).toBe(0);
});

test("实际收益 ≤ 0 且有月开销：无解，不偷偷抬高收益", () => {
  for (const rPct of [0, -1]) {
    expect(calcFreedom({ ...tier1, rPct })).toEqual({ ok: false, reason: "non-positive-real-return" });
  }
});

test("实际收益 ≤ 0 但月开销为 0：仍可算大项", () => {
  const r = ok({ ...tier1, X: 0, rPct: 0 });
  expect(r.target).toBe(11500000);
  expect(r.multiplier).toBe(0);
});

test("非法输入报错，不按 0 计算", () => {
  const bad: [FreedomInput, string][] = [
    [{ X: "abc", rPct: 2.5, A: 3000000 }, "X"],
    [{ rPct: 2.5 } as FreedomInput, "X"],
    [{ X: -5000 }, "X"],
    [{ X: 10000, rPct: "x" }, "rPct"],
    [{ X: 10000, N: 1.5 }, "N"],
    [{ X: 10000, M: -1 }, "M"],
    [{ X: 10000, A: "1,2a" }, "A"],
  ];
  for (const [p, field] of bad) {
    expect(calcFreedom(p), JSON.stringify(p)).toEqual({ ok: false, reason: "invalid-input", field });
  }
});

test("字符串与千分位输入可解析，可选项留空按 0", () => {
  const r = ok({ X: "10,000", rPct: "", K: "", A: " 1,000,000 " });
  expect(r.target).toBe(4800000);
  expect(r.A).toBe(1000000);
});

test("还需攒多久：已有资产也复利", () => {
  const years = yearsToGoal(4800000, 2000000, 10000, 2.5);
  expect(years).toBeCloseTo(13.81, 2);
  expect(yearsToGoal(4800000, 0, 0, 2.5)).toBe(null);
  expect(yearsToGoal(4800000, 2400000, 10000, 0)).toBe(20);
  expect(yearsToGoal(4800000, 5000000, 0, 2.5)).toBe(0);
});

test("只有资产、不再存钱：靠复利也能到达", () => {
  const years = yearsToGoal(4800000, 2400000, 0, 2.5);
  expect(years).toBeCloseTo(Math.log(2) / Math.log(1 + 0.025 / 12) / 12, 9);
});

test("fmtWan：千万以上取整加千分位，以下最多一位小数", () => {
  expect(fmtWan(18_700_000)).toBe("1,870 万");
  expect(fmtWan(1_435_200)).toBe("143.5 万");
  expect(fmtWan(713_000)).toBe("71.3 万");
  expect(fmtWan(4_800_000)).toBe("480 万");
  expect(fmtWan(10_000)).toBe("1 万");
  expect(fmtWan(9_999)).toBe("9,999 元");
});
