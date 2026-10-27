import type { FreedomOk } from "../core/calc";
import type { Question, State, Step } from "./state";

export interface Ctx {
  state: State;
  /** 结构变化（换题、选项切换）：整屏重画 */
  render(): void;
  /** 输入文字变化：只跑各视图登记的更新函数，不重画，输入框保持焦点 */
  refresh(): void;
  onRefresh(fn: () => void): void;
  go(step: Step): void;
}

export const PARTS: readonly { q: Question; name: string; cls: string; amount: (r: FreedomOk) => number }[] = [
  { q: "X", name: "日常开销", cls: "living", amount: (r) => r.daily },
  { q: "kids", name: "养孩子", cls: "kids", amount: (r) => r.kids },
  { q: "M", name: "医疗", cls: "medical", amount: (r) => r.M },
  { q: "house", name: "住房", cls: "house", amount: (r) => r.H },
];
