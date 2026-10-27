import { fmtWan, type FreedomOk } from "../../core/calc";
import { REFS } from "../../core/refs";
import { PARTS, type Ctx } from "../ctx";
import { h } from "../dom";
import { compute, haveInputs, kidsCount, startEdit } from "../state";
import { amountField, infoToggle, refChips, totalBlock } from "./parts";

export function resultView(ctx: Ctx, restart: () => void): HTMLElement {
  const s = ctx.state;
  return h(
    "div",
    { class: "result" },
    h("section", { class: "card result-main" },
      s.example && h("span", { class: "tag" }, s.edited ? "视频示例 · 已修改" : "视频示例"),
      h("h2", { id: "q-title", tabindex: -1, class: "sr-only" }, "结果"),
      totalBlock(ctx, { label: "财富自由需要", big: true }),
      breakdown(ctx)),
    h("div", { class: "result-side" },
      haveCard(ctx),
      compareCard(ctx),
      assumeCard(ctx),
      h("div", { class: "result-actions" },
        h("button", { type: "button", class: "btn ghost", onclick: restart }, "重新开始"))),
  );
}

/** 视频公式竖式：每行可点回去改 */
function breakdown(ctx: Ctx): HTMLElement {
  const s = ctx.state;
  const rows = PARTS.map((p) => {
    const formula = h("span", { class: "formula-tag" });
    const amount = h("span", { class: "amt" });
    const row = h("button", {
      type: "button",
      class: `row ${p.cls}`,
      onclick: () => {
        startEdit(s, p.q);
        ctx.go(p.q);
      },
    }, h("span", { class: "op" }, "+"), h("i", { class: "dot" }), h("span", { class: "name" }, p.name), formula, amount, h("span", { class: "chev", "aria-hidden": "true" }, "›"));
    return { p, row, formula, amount };
  });
  const totalAmt = h("span", { class: "amt" });

  const wrap = h("div", { class: "breakdown" });
  ctx.onRefresh(() => {
    const r = compute(s);
    // 收益率无效时顶部已提示无解，分项不能留着旧金额
    wrap.hidden = !r.ok;
    if (!r.ok) return;
    for (const { p, formula, amount } of rows) {
      formula.textContent = formulaText(p.q, r, ctx);
      amount.textContent = fmtWan(p.amount(r));
    }
    totalAmt.textContent = fmtWan(r.target);
  });

  wrap.append(
    ...rows.map((r) => r.row),
    h("div", { class: "row sum" }, h("span", { class: "op" }, "="), h("span", { class: "name" }, "合计"), totalAmt));
  return wrap;
}

function formulaText(q: string, r: FreedomOk, ctx: Ctx): string {
  const s = ctx.state;
  switch (q) {
    case "X":
      return `${Math.round(r.multiplier)} × ${fmtWan(r.X)}`;
    case "kids": {
      const n = kidsCount(s) ?? 0;
      return n > 0 ? `${fmtWan(r.kids / n)} × ${n}` : "不要孩子";
    }
    case "M":
      return "";
    default:
      return { own: "有房无贷", mortgage: "月供已计入月开销", rent: "租房", buy: "" }[s.housing ?? "buy"];
  }
}

/** 我现在有多少：完成度、每月可花、还需几年 */
function haveCard(ctx: Ctx): HTMLElement {
  const s = ctx.state;
  if (!s.showHave) {
    return h("button", {
      type: "button",
      class: "card have-open",
      onclick: () => {
        s.showHave = true;
        ctx.render();
        document.getElementById("f-A")?.focus();
      },
    }, h("span", null, "我现在有多少？"), h("span", { class: "chev" }, "›"));
  }

  const info = infoToggle(REFS.A.notes, "notes-A");
  const fill = h("span", { class: "fill" });
  const pct = h("span", { class: "pct" });
  const lines = h("ul", { class: "have-lines", "aria-live": "polite" });
  const progress = h("div", { class: "progress" }, h("div", { class: "track" }, fill), pct);

  ctx.onRefresh(() => {
    const r = compute(s);
    const have = haveInputs(s);
    const show = r.ok && have !== null && s.text.A.trim() !== "";
    lines.replaceChildren();
    progress.hidden = !show;
    if (!show) return;
    const percent = r.covered ? 100 : Math.min(99, Math.floor((r.A / r.target) * 100));
    fill.style.width = `${percent}%`;
    pct.textContent = r.covered ? "已达到" : `${percent}%`;

    const add = (text: string) => lines.append(h("li", null, text));
    if (!r.covered) add(`还差 ${fmtWan(r.gap)}`);
    if (r.free > 0) add(`按现有资产，每月约可花 ${fmtWan(r.maxX)}`);
    else if (r.free === 0) add("现有资产刚好够孩子、医疗、住房，日常开销还没有着落");
    else add(`现有资产还不够付孩子、医疗、住房，差 ${fmtWan(-r.free)}`);
    if (!r.covered && r.yearsNeeded !== null) {
      const save = r.S > 0 ? `每月再存 ${fmtWan(r.S)}` : "不再存钱、只靠收益";
      add(`${save}，约 ${Math.ceil(r.yearsNeeded * 10) / 10} 年达到`);
    }
  });

  return h("section", { class: "card have" },
    h("div", { class: "q-head" }, h("h3", null, "我现在有多少？"), info.btn),
    info.panel,
    amountField(ctx, "A", "万", { label: "能拿来投资的钱" }),
    refChips(ctx, "A", REFS.A),
    h("h3", { class: "minor" }, "每月还能存多少（可不填）"),
    amountField(ctx, "S", "元/月", { label: "每月能存多少" }),
    progress,
    lines);
}

/** 只比日常部分：小Lin 与社区 4% / 3% 法则 */
function compareCard(ctx: Ctx): HTMLElement {
  const items = [
    { key: "lin", label: "" },
    { key: "fire3", label: "3% 法则 · 年开销 × 33" },
    { key: "fire4", label: "4% 法则 · 年开销 × 25" },
  ].map((it) => {
    const fill = h("span", { class: `fill ${it.key}` });
    const label = h("span", { class: "c-label" }, it.label);
    const amt = h("span", { class: "amt" });
    return { ...it, el: h("li", null, h("div", { class: "c-head" }, label, amt), h("div", { class: "track" }, fill)), fill, label, amt };
  });
  const card = h("section", { class: "card compare" },
    h("h3", null, "只看日常开销，和常见算法比"),
    h("ul", null, ...items.map((i) => i.el)),
    h("p", { class: "fine" }, "4% / 3% 法则来自海外 FIRE 社区，假设本金可以慢慢花掉；小Lin 的口径要求本金不缩水，所以更高。两者都不含孩子、医疗、住房。"));

  ctx.onRefresh(() => {
    const r = compute(ctx.state);
    card.hidden = !r.ok || r.X === 0;
    if (!r.ok) return;
    const values: Record<string, number> = { lin: r.daily, fire3: r.fire3, fire4: r.fire4 };
    const max = Math.max(...Object.values(values), 1);
    for (const it of items) {
      if (it.key === "lin") it.label.textContent = `小Lin · 月开销 × ${Math.round(r.multiplier)}`;
      it.amt.textContent = fmtWan(values[it.key]);
      it.fill.style.width = `${(values[it.key] / max) * 100}%`;
    }
  });
  return card;
}

/** 假设：调实际收益率 */
function assumeCard(ctx: Ctx): HTMLElement {
  const multiplier = h("span", { class: "mult" });
  const summary = h("summary", null, h("span", null, "假设：实际收益率 ", h("b")));
  ctx.onRefresh(() => {
    const r = compute(ctx.state);
    (summary.querySelector("b") as HTMLElement).textContent = `${ctx.state.text.rPct || "—"}%`;
    multiplier.textContent = r.ok && r.multiplier > 0 ? `乘数 = 12 ÷ ${r.rPct}% = ${Math.round(r.multiplier * 10) / 10}` : "";
  });
  const r = compute(ctx.state);
  return h("details", { class: "card assume", open: !r.ok },
    summary,
    h("div", { class: "assume-body" },
      amountField(ctx, "rPct", "%", { label: "实际收益率" }),
      refChips(ctx, "rPct", REFS.rPct),
      multiplier,
      h("ul", { class: "notes" }, ...REFS.rPct.notes.map((n) => h("li", null, n.text)))));
}
