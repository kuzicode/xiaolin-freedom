import { fmtWan } from "../../core/calc";
import { REFS } from "../../core/refs";
import { PARTS, type Ctx } from "../ctx";
import { h } from "../dom";
import { cancelEdit, compute, counted, nextStep, prevStep, QUESTIONS, questionValid, type Housing, type Question } from "../state";
import { amountField, infoToggle, refChips, totalBlock } from "./parts";

const TITLES: Record<Question, string> = {
  X: "理想的生活，每月花多少？",
  kids: "打算养几个孩子？",
  M: "一辈子的医疗费，留多少？",
  house: "住房怎么打算？",
};

export function questionView(ctx: Ctx): HTMLElement {
  const s = ctx.state;
  const q = s.step as Question;
  const index = QUESTIONS.indexOf(q);
  const isLast = index === QUESTIONS.length - 1;

  const next = () => {
    if (!questionValid(s, q)) return;
    s.answered.add(q);
    if (s.example) s.edited = true;
    const to = nextStep(s);
    s.returnToResult = false;
    s.editBackup = null;
    ctx.go(to);
  };
  const back = () => {
    if (s.returnToResult) cancelEdit(s);
    else s.step = prevStep(s);
    ctx.go(s.step);
  };

  const nextBtn = h("button", { type: "button", class: "btn primary", onclick: next },
    s.returnToResult ? "回到结果" : isLast ? "看结果" : "下一步");
  ctx.onRefresh(() => {
    nextBtn.disabled = !questionValid(s, q);
  });

  const notes = q === "kids" ? REFS.K.notes : q === "house" ? REFS.H.notes : REFS[q].notes;
  const info = infoToggle(notes, `notes-${q}`);

  const card = h(
    "section",
    { class: `card q-card ${PARTS[index].cls}` },
    h("div", { class: "q-top" },
      h("button", { type: "button", class: "link", onclick: back }, s.returnToResult ? "‹ 放弃修改" : "‹ 上一步"),
      h("ol", { class: "dots", "aria-label": `第 ${index + 1} 题，共 ${QUESTIONS.length} 题` },
        ...QUESTIONS.map((_, i) => h("li", { class: i === index ? "on" : i < index ? "done" : "" }))),
    ),
    h("div", { class: "q-head" }, h("h2", { id: "q-title", tabindex: -1 }, TITLES[q]), info.btn),
    info.panel,
    body(ctx, q, next),
    h("div", { class: "q-actions" }, nextBtn),
  );

  return h("div", { class: "stage" }, card, summaryPanel(ctx));
}

function body(ctx: Ctx, q: Question, next: () => void): HTMLElement {
  const s = ctx.state;
  switch (q) {
    case "X":
      return h("div", { class: "q-body" },
        amountField(ctx, "X", "元/月", { label: TITLES.X, placeholder: "不含养孩子、医疗、买房", onEnter: next }),
        refChips(ctx, "X", REFS.X));

    case "M":
      return h("div", { class: "q-body" },
        amountField(ctx, "M", "万", { label: TITLES.M, onEnter: next }),
        refChips(ctx, "M", REFS.M));

    case "kids": {
      const choices: (number | "4+")[] = [0, 1, 2, 3, "4+"];
      const n = s.kidsChoice;
      return h("div", { class: "q-body" },
        h("div", { class: "choices", role: "group", "aria-label": "孩子个数" },
          ...choices.map((c) => h("button", {
            type: "button",
            class: "choice",
            "aria-pressed": String(n === c),
            onclick: () => {
              s.kidsChoice = c;
              ctx.render();
            },
          }, c === 0 ? "不要" : String(c)))),
        n === "4+" && amountField(ctx, "N4", "个", { label: "孩子个数", onEnter: next }),
        n !== null && n !== 0 && h("div", { class: "sub" },
          h("h3", null, "每个孩子养到 18 岁，留多少？"),
          amountField(ctx, "K", "万", { label: "每个孩子的成本", onEnter: next }),
          refChips(ctx, "K", REFS.K)),
      );
    }

    case "house": {
      const options: [Housing, string][] = [["own", "已经有房"], ["rent", "一直租房"], ["buy", "打算买房"]];
      return h("div", { class: "q-body" },
        h("div", { class: "choices wide", role: "group", "aria-label": "住房打算" },
          ...options.map(([v, label]) => h("button", {
            type: "button",
            class: "choice",
            "aria-pressed": String(s.housing === v),
            onclick: () => {
              s.housing = v;
              ctx.render();
            },
          }, label))),
        s.housing === "rent" && h("p", { class: "hint" }, "房租请算进第 1 题的月开销"),
        s.housing === "buy" && h("div", { class: "sub" },
          h("h3", null, "买房预算（全款）"),
          amountField(ctx, "H", "万", { label: "买房预算", onEnter: next }),
          refChips(ctx, "H", REFS.H)),
      );
    }
  }
}

/** 手机在题卡上方、PC 在右侧：总额 + 分项 */
function summaryPanel(ctx: Ctx): HTMLElement {
  const rows = PARTS.map((p) => {
    const amount = h("span", { class: "amt" });
    const row = h("li", { class: p.cls }, h("i", { class: "dot" }), h("span", null, p.name), amount);
    return { p, row, amount };
  });
  ctx.onRefresh(() => {
    const r = compute(ctx.state);
    const inc = counted(ctx.state);
    for (const { p, row, amount } of rows) {
      const on = r.ok && inc.has(p.q);
      row.classList.toggle("off", !on);
      amount.textContent = on && r.ok ? fmtWan(p.amount(r)) : "—";
    }
  });
  return h("aside", { class: "card summary" },
    totalBlock(ctx, { label: "财富自由需要" }),
    h("ul", { class: "legend" }, ...rows.map((r) => r.row)));
}
