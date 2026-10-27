type Child = Node | string | number | null | undefined | false;
type Props = Record<string, unknown>;

/** 极简 DOM 构造：on* 绑事件，class / 其余键写属性，false / null 跳过 */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props | null = null,
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props ?? {})) {
    if (v === false || v === null || v === undefined) continue;
    if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v as EventListener);
    else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else el.setAttribute(k, v === true ? "" : String(v));
  }
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : String(c));
  }
  return el;
}

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/** 数字滚动到新值；减弱动效时直接显示 */
export function animateNumber(el: HTMLElement, to: number, format: (n: number) => string): void {
  const from = Number(el.dataset.value ?? 0);
  el.dataset.value = String(to);
  if (reduceMotion.matches || from === to) {
    el.textContent = format(to);
    return;
  }
  const start = performance.now();
  const duration = 450;
  const tick = (now: number) => {
    if (el.dataset.value !== String(to)) return;
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - (1 - t) ** 3;
    el.textContent = format(from + (to - from) * eased);
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
