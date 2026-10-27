import "./style.css";
import type { Ctx } from "./ctx";
import { h } from "./dom";
import { firstInvalidQuestion, initialState, type State } from "./state";
import { introView } from "./views/intro";
import { questionView } from "./views/question";
import { resultView } from "./views/result";

const root = document.getElementById("app")!;
let updaters: (() => void)[] = [];

const ctx: Ctx = {
  state: initialState(),
  render,
  refresh: () => updaters.forEach((fn) => fn()),
  onRefresh: (fn) => updaters.push(fn),
  go(step) {
    // 兜底：四题没全部填好就不进结果页，跳到第一道没填好的题
    const missing = step === "result" ? firstInvalidQuestion(ctx.state) : null;
    ctx.state.step = missing ?? step;
    render();
    window.scrollTo({ top: 0 });
    document.getElementById("q-title")?.focus({ preventScroll: true });
  },
};

function load(s: State) {
  ctx.state = s;
  ctx.go(s.step);
}

function restart() {
  // 视频示例的数不能混进个人结果；自己算的保留输入，方便微调
  const s = ctx.state.example ? initialState() : { ...ctx.state, answered: new Set(ctx.state.answered) };
  s.step = "X";
  s.returnToResult = false;
  load(s);
}

function render() {
  updaters = [];
  const s = ctx.state;
  const view = s.step === "intro" ? introView(ctx, load) : s.step === "result" ? resultView(ctx, restart) : questionView(ctx);
  root.replaceChildren(
    h("header", { class: "top" },
      h("button", { type: "button", class: "brand", onclick: () => load(initialState()) }, "财富自由计算器"),
      h("a", { class: "icon-btn", href: REPO_URL, target: "_blank", rel: "noopener", "aria-label": "GitHub 开源代码", title: "GitHub 开源代码" }, githubIcon())),
    h("main", { class: `page step-${s.step}` }, view),
    footer(),
  );
  ctx.refresh();
}

const REPO_URL = "https://github.com/kuzicode/xiaolin-freedom";
// GitHub 标志路径来自 Simple Icons（CC0）
const GITHUB_PATH = "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12";

function githubIcon(): SVGSVGElement {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const p = document.createElementNS(ns, "path");
  p.setAttribute("d", GITHUB_PATH);
  svg.append(p);
  return svg;
}

function footer() {
  return h("footer", { class: "foot" },
    h("p", null, "非官方工具，公式出自小Lin说视频"),
    h("p", null, "简化模型，未考虑投资波动、税和费用，不构成投资建议 · 计算都在你的设备上完成，不上传任何数据"));
}

render();
