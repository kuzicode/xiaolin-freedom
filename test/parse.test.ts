import { test, expect } from "vitest";
import { parseInput } from "../src/core/parse";

const val = (text: string, unit: Parameters<typeof parseInput>[1]) => {
  const r = parseInput(text, unit);
  return r.ok ? r.value : r.error;
};

test("元字段：纯数字、千分位、万 / 亿后缀、全角", () => {
  expect(val("15000", "yuan")).toBe(15000);
  expect(val("15,000", "yuan")).toBe(15000);
  expect(val("1.5万", "yuan")).toBe(15000);
  expect(val(" １５０００ ", "yuan")).toBe(15000);
  expect(val("8000元", "yuan")).toBe(8000);
});

test("万元字段：默认按万，带后缀按字面", () => {
  expect(val("150", "wan")).toBe(1_500_000);
  expect(val("150万", "wan")).toBe(1_500_000);
  expect(val("1.2亿", "wan")).toBe(120_000_000);
  expect(val("71.3", "wan")).toBe(713_000);
  expect(val("1.1", "wan")).toBe(11_000);
});

test("百分数与个数", () => {
  expect(val("2.5", "percent")).toBe(2.5);
  expect(val("2.5%", "percent")).toBe(2.5);
  expect(val("2", "count")).toBe(2);
  expect(val("1.5", "count")).toBe("invalid");
  expect(val("3万", "percent")).toBe("invalid");
});

test("非法输入给出原因，不按 0 算", () => {
  expect(val("", "yuan")).toBe("empty");
  expect(val("abc", "yuan")).toBe("invalid");
  expect(val("1,5", "yuan")).toBe("invalid");
  expect(val("-100", "yuan")).toBe("negative");
  expect(val("-0", "yuan")).toBe(0);
  expect(val("11", "percent")).toBe("too-large");
  expect(val("21", "count")).toBe("too-large");
});
