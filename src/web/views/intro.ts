import type { Ctx } from "../ctx";
import { h } from "../dom";
import { exampleState } from "../state";

export function introView(ctx: Ctx, loadExample: (s: ReturnType<typeof exampleState>) => void): HTMLElement {
  const term = (cls: string, text: string) => h("span", { class: `term ${cls}` }, text);
  return h(
    "section",
    { class: "intro" },
    h("h1", { id: "q-title", tabindex: -1 }, "你需要多少钱，", h("br"), "才能财富自由？"),
    h("p", { class: "formula", "aria-label": "公式：480 乘月开销，加孩子、医疗、住房" },
      term("living", "480 × 月开销"), " + ", term("kids", "孩子"), " + ", term("medical", "医疗"), " + ", term("house", "住房")),
    h("p", { class: "lead" }, "回答 4 个问题，算出你自己的数"),
    h("div", { class: "intro-actions" },
      h("button", { type: "button", class: "btn primary big", onclick: () => ctx.go("X") }, "开始"),
      h("button", { type: "button", class: "btn ghost", onclick: () => loadExample(exampleState()) }, "先看视频里的例子")),
  );
}
