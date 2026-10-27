import { fmtWan } from "../../core/calc";
import { PARSE_MESSAGE } from "../../core/parse";
import type { FieldRefs, Source } from "../../core/refs";
import { PARTS, type Ctx } from "../ctx";
import { animateNumber, h } from "../dom";
import { compute, parsed, UNITS, type TextField } from "../state";

/** 带单位的输入框 + 错误提示；输入时只 refresh，不重画 */
export function amountField(ctx: Ctx, field: TextField, unit: string, opts: { label: string; placeholder?: string; onEnter?: () => void }) {
  const err = h("p", { class: "err", id: `e-${field}`, "aria-live": "polite" });
  const input = h("input", {
    id: `f-${field}`,
    type: "text",
    inputmode: "decimal",
    autocomplete: "off",
    "aria-label": opts.label,
    "aria-describedby": `e-${field}`,
    placeholder: opts.placeholder ?? "",
    value: ctx.state.text[field],
    oninput: () => {
      ctx.state.text[field] = input.value;
      ctx.refresh();
    },
    onkeydown: (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.isComposing) opts.onEnter?.();
    },
  });
  ctx.onRefresh(() => {
    const p = parsed(ctx.state, field);
    const msg = p.ok ? "" : PARSE_MESSAGE[p.error];
    err.textContent = msg;
    input.setAttribute("aria-invalid", msg ? "true" : "false");
  });
  return h("div", { class: "field" }, h("label", { class: "input-wrap" }, input, h("span", { class: "unit" }, unit)), err);
}

/** 参考值按钮：点一下填入输入框；当前值命中时高亮 */
export function refChips(ctx: Ctx, field: TextField, data: FieldRefs) {
  const toText = (v: number) => String(UNITS[field] === "wan" ? v / 10000 : v);
  const chips = data.refs.map((r) =>
    h("button", {
      type: "button",
      class: "chip",
      onclick: () => {
        ctx.state.text[field] = toText(r.value);
        const input = document.getElementById(`f-${field}`) as HTMLInputElement | null;
        if (input) input.value = ctx.state.text[field];
        ctx.refresh();
      },
    }, r.label),
  );
  ctx.onRefresh(() => {
    const p = parsed(ctx.state, field);
    data.refs.forEach((r, i) => chips[i].setAttribute("aria-pressed", String(p.ok && p.value === r.value)));
  });
  return h("div", { class: "chips", role: "group", "aria-label": "参考值" }, ...chips);
}

/** 标题旁的 ⓘ：展开口径说明与出处 */
export function infoToggle(notes: Source[], id: string) {
  const panel = h(
    "ul",
    { class: "notes", id, hidden: true },
    ...notes.map((n) => h("li", null, n.url ? h("a", { href: n.url, target: "_blank", rel: "noopener" }, n.text) : n.text)),
  );
  const btn = h("button", {
    type: "button",
    class: "info",
    "aria-label": "说明与数据来源",
    "aria-expanded": "false",
    "aria-controls": id,
    onclick: () => {
      panel.hidden = !panel.hidden;
      btn.setAttribute("aria-expanded", String(!panel.hidden));
    },
  }, "i");
  return { btn, panel };
}

// 换屏重画时从上一屏显示的数接着滚，而不是每次从 0 开始
let shownTotal = 0;

/** 总额 + 四色分段条；问答页右侧 / 顶部与结果页共用 */
export function totalBlock(ctx: Ctx, opts: { label: string; big?: boolean }) {
  const num = h("div", { class: opts.big ? "total-num big" : "total-num", "aria-live": "polite", "data-value": shownTotal }, fmtWan(shownTotal));
  const segs = PARTS.map((p) => h("span", { class: `seg ${p.cls}`, title: p.name }));
  const bar = h("div", { class: "bar", "aria-hidden": "true" }, ...segs);
  const msg = h("p", { class: "total-msg", hidden: true });

  ctx.onRefresh(() => {
    const r = compute(ctx.state);
    num.hidden = !r.ok;
    bar.hidden = !r.ok;
    msg.hidden = r.ok;
    if (!r.ok) {
      msg.textContent = r.reason === "non-positive-real-return"
        ? "实际收益率不高于 0 时，本金总会花完，这个公式没有答案。调高一点收益率再看。"
        : "实际收益率请填一个数字，如 2.5";
      return;
    }
    shownTotal = r.target;
    animateNumber(num, r.target, fmtWan);
    PARTS.forEach((p, i) => {
      const share = r.target > 0 ? (p.amount(r) / r.target) * 100 : 0;
      segs[i].style.flexBasis = `${share}%`;
    });
  });
  return h("div", { class: "total" }, h("div", { class: "total-label" }, opts.label), num, msg, bar);
}
