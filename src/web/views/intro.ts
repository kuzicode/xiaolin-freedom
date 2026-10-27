import type { Ctx } from "../ctx";
import { h } from "../dom";
import { VIDEO } from "../../core/refs";
import { exampleState } from "../state";
import videoCover from "../assets/video-cover.jpg";

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
      h("button", { type: "button", class: "btn ghost", onclick: () => loadExample(exampleState()) }, "视频示例计算")),
    videoCard(),
  );
}

/** 公式出处：静态视频卡片（封面为视频截图），点击去 B 站 */
function videoCard(): HTMLElement {
  return h("a", { class: "video-card", href: VIDEO.url, target: "_blank", rel: "noopener" },
    h("div", { class: "vc-cover" },
      h("img", { src: videoCover, alt: "视频封面：12X / 2.5% = 480X", width: 720, height: 404, loading: "lazy", decoding: "async" }),
      h("span", { class: "vc-play", "aria-hidden": "true" })),
    h("div", { class: "vc-meta" },
      h("p", { class: "vc-title" }, "你需要多少钱，才能财富自由？"),
      h("p", { class: "vc-author" }, "小Lin说 · 公式出处")));
}
