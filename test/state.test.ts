import { test, expect } from "vitest";
import { cancelEdit, compute, exampleState, firstInvalidQuestion, haveInputs, startEdit } from "../src/web/state";

const target = (s: ReturnType<typeof exampleState>) => {
  const r = compute(s);
  return r.ok ? r.target : r.reason;
};

test("视频示例：四题齐全，1870 万", () => {
  const s = exampleState();
  expect(firstInvalidQuestion(s)).toBe(null);
  expect(target(s)).toBe(18_700_000);
});

test("从结果页回去改、清空后放弃修改：恢复原答案，不按 0 算", () => {
  const s = exampleState();
  startEdit(s, "X");
  s.text.X = "";
  expect(firstInvalidQuestion(s)).toBe("X");
  cancelEdit(s);
  expect(s.step).toBe("result");
  expect(s.text.X).toBe("15000");
  expect(target(s)).toBe(18_700_000);
});

test("放弃修改也恢复选项类答案", () => {
  const s = exampleState();
  startEdit(s, "house");
  s.housing = "buy";
  s.text.H = "abc";
  s.kidsChoice = "4+";
  cancelEdit(s);
  expect(s.housing).toBe("buy");
  expect(s.text.H).toBe("700");
  expect(s.kidsChoice).toBe(2);
});

test("资产 / 月存：留空按 0，非法返回 null", () => {
  const s = exampleState();
  expect(haveInputs(s)).toEqual({ A: 0, S: 0 });
  s.text.A = "300";
  expect(haveInputs(s)).toEqual({ A: 3_000_000, S: 0 });
  s.text.S = "10000";
  expect(haveInputs(s)).toEqual({ A: 3_000_000, S: 10_000 });
  s.text.A = "abc";
  expect(haveInputs(s)).toBe(null);
  s.text.A = "300";
  s.text.S = "-1";
  expect(haveInputs(s)).toBe(null);
});

test("收益率无效或 ≤ 0：结果不可用", () => {
  const s = exampleState();
  s.text.rPct = "0";
  expect(target(s)).toBe("non-positive-real-return");
  s.text.rPct = "abc";
  expect(target(s)).toBe("invalid-input");
});

test("正在还房贷：剩余本金一次性计入住房项", () => {
  const s = exampleState();
  s.housing = "mortgage";
  s.text.L = "50";
  expect(firstInvalidQuestion(s)).toBe(null);
  const r = compute(s);
  expect(r.ok && r.H).toBe(500_000);
  expect(r.ok && r.target).toBe(12_200_000);
});

test("正在还房贷：剩余本金未填或非法时不能出结果，也不沿用买房预算", () => {
  const s = exampleState();
  s.housing = "mortgage";
  expect(firstInvalidQuestion(s)).toBe("house");
  s.text.L = "abc";
  expect(firstInvalidQuestion(s)).toBe("house");
});

test("有房无贷 / 一直租房：住房按 0 算", () => {
  for (const housing of ["own", "rent"] as const) {
    const s = exampleState();
    s.housing = housing;
    const r = compute(s);
    expect(r.ok && r.H).toBe(0);
  }
});
