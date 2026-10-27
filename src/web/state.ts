import { calcFreedom, type FreedomResult } from "../core/calc";
import { parseInput, type Parsed, type Unit } from "../core/parse";
import { VIDEO_EXAMPLE } from "../core/refs";

export type Question = "X" | "kids" | "M" | "house";
export type Step = "intro" | Question | "result";
export type Housing = "own" | "rent" | "buy";
export type TextField = "X" | "K" | "N4" | "M" | "H" | "rPct" | "A" | "S";

export const QUESTIONS: readonly Question[] = ["X", "kids", "M", "house"];

export const UNITS: Record<TextField, Unit> = {
  X: "yuan", K: "wan", N4: "count", M: "wan", H: "wan", rPct: "percent", A: "wan", S: "yuan",
};

export interface State {
  step: Step;
  /** 走的是「先看视频里的例子」路径；edited 表示之后改过答案 */
  example: boolean;
  edited: boolean;
  text: Record<TextField, string>;
  kidsChoice: number | "4+" | null;
  housing: Housing | null;
  answered: Set<Question>;
  /** 从结果页点回来改某一题，改完直接回结果；editBackup 用于放弃修改时恢复 */
  returnToResult: boolean;
  editBackup: Answers | null;
  showHave: boolean;
}

type Answers = Pick<State, "text" | "kidsChoice" | "housing">;

const EMPTY_TEXT: Record<TextField, string> = { X: "", K: "", N4: "", M: "", H: "", rPct: "2.5", A: "", S: "" };

export function initialState(): State {
  return {
    step: "intro",
    example: false,
    edited: false,
    text: { ...EMPTY_TEXT },
    kidsChoice: null,
    housing: null,
    answered: new Set(),
    returnToResult: false,
    editBackup: null,
    showHave: false,
  };
}

export function exampleState(): State {
  const wan = (yuan: number) => String(yuan / 10000);
  return {
    ...initialState(),
    step: "result",
    example: true,
    text: {
      ...EMPTY_TEXT,
      X: String(VIDEO_EXAMPLE.X),
      K: wan(VIDEO_EXAMPLE.K),
      M: wan(VIDEO_EXAMPLE.M),
      H: wan(VIDEO_EXAMPLE.H),
    },
    kidsChoice: VIDEO_EXAMPLE.N,
    housing: "buy",
    answered: new Set(QUESTIONS),
  };
}

export function parsed(s: State, f: TextField): Parsed {
  return parseInput(s.text[f], UNITS[f]);
}

function value(s: State, f: TextField): number | null {
  const p = parsed(s, f);
  return p.ok ? p.value : null;
}

export function kidsCount(s: State): number | null {
  if (s.kidsChoice === "4+") return value(s, "N4");
  return s.kidsChoice;
}

export function questionValid(s: State, q: Question): boolean {
  switch (q) {
    case "X":
      return value(s, "X") !== null;
    case "kids": {
      const n = kidsCount(s);
      return n !== null && (n === 0 || value(s, "K") !== null);
    }
    case "M":
      return value(s, "M") !== null;
    case "house":
      return s.housing !== null && (s.housing !== "buy" || value(s, "H") !== null);
  }
}

/** 四题都已填好、可以展示正式结果 */
export function firstInvalidQuestion(s: State): Question | null {
  return QUESTIONS.find((q) => !questionValid(s, q)) ?? null;
}

/** 从结果页点某一行回去改 */
export function startEdit(s: State, q: Question): void {
  s.editBackup = { text: { ...s.text }, kidsChoice: s.kidsChoice, housing: s.housing };
  s.returnToResult = true;
  s.step = q;
}

/** 放弃修改（点「上一步」）：恢复进入时的答案，不能把改了一半的答案当结果 */
export function cancelEdit(s: State): void {
  if (s.editBackup) Object.assign(s, s.editBackup);
  s.editBackup = null;
  s.returnToResult = false;
  s.step = "result";
}

/** 资产 / 月存：留空按 0，非法返回 null（不能把非法当成 0 继续算） */
export function haveInputs(s: State): { A: number; S: number } | null {
  const pick = (f: "A" | "S") => {
    const p = parsed(s, f);
    return p.ok ? p.value : p.error === "empty" ? 0 : null;
  };
  const A = pick("A");
  const S = pick("S");
  return A === null || S === null ? null : { A, S };
}

/** 计入总额的题：已答的，加上正在答且已填好的当前题（边输入边累加） */
export function counted(s: State): Set<Question> {
  const set = new Set([...s.answered].filter((q) => questionValid(s, q)));
  if (QUESTIONS.includes(s.step as Question) && questionValid(s, s.step as Question)) set.add(s.step as Question);
  return set;
}

export function compute(s: State): FreedomResult {
  const inc = counted(s);
  const have = haveInputs(s) ?? { A: 0, S: 0 };
  const n = kidsCount(s) ?? 0;
  return calcFreedom({
    X: inc.has("X") ? value(s, "X") : 0,
    K: inc.has("kids") && n > 0 ? value(s, "K") : 0,
    N: inc.has("kids") ? n : 0,
    M: inc.has("M") ? value(s, "M") : 0,
    H: inc.has("house") && s.housing === "buy" ? value(s, "H") : 0,
    rPct: value(s, "rPct") ?? NaN,
    // 资产 / 月存非法时只影响「我现在有多少」，那里用 haveInputs 判空并停止展示
    A: have.A,
    S: have.S,
  });
}

export function nextStep(s: State): Step {
  if (s.returnToResult) return "result";
  const i = QUESTIONS.indexOf(s.step as Question);
  return i < QUESTIONS.length - 1 ? QUESTIONS[i + 1] : "result";
}

export function prevStep(s: State): Step {
  if (s.returnToResult) return "result";
  const i = QUESTIONS.indexOf(s.step as Question);
  return i > 0 ? QUESTIONS[i - 1] : "intro";
}
