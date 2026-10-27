/**
 * 参考值按钮的数据，每条附出处（见各字段 notes）。
 * value 用核心单位：金额为元，收益率为百分数。
 */

interface Ref {
  value: number;
  label: string;
}

export interface Source {
  text: string;
  url?: string;
}

export interface FieldRefs {
  refs: Ref[];
  notes: Source[];
}

const NBS: Source = {
  text: "国家统计局《2025 年居民收入和消费支出情况》：全国人均 29,476 元/年，城镇 35,869 元/年",
  url: "https://www.stats.gov.cn/sj/zxfb/202601/t20260119_1962321.html",
};
const YUWA: Source = {
  text: "育娲人口智库《中国生育成本报告 2026 版》（2024 年数据）：每孩从备孕到 18 岁，全国 58 万，城镇 71.3 万",
  url: "https://file.c-ctrip.com/files/6/yuwa/0R74p12000smu5mcx984C.pdf",
};
export const VIDEO: Source = {
  text: "小Lin说《你需要多少钱，才能财富自由？》",
  url: "https://www.bilibili.com/video/BV1yUHP6rEYD",
};

export const REFS = {
  X: {
    refs: [
      { value: 2456, label: "全国人均 2,456" },
      { value: 2990, label: "城镇人均 2,990" },
      { value: 5980, label: "城镇两口子 5,980" },
      { value: 8000, label: "8,000" },
      { value: 15000, label: "一线中产 15,000" },
    ],
    notes: [
      { text: "房租或房贷月供算在这里；不含养孩子、医疗、买房" },
      { text: "两口子一起算就填两人的开销" },
      NBS,
    ],
  },
  K: {
    refs: [
      { value: 580_000, label: "全国 58 万" },
      { value: 713_000, label: "城镇 71.3 万" },
      { value: 1_000_000, label: "100 万" },
      { value: 1_500_000, label: "一线 150 万" },
    ],
    notes: [{ text: "从今天起到孩子 18 岁还要留多少；已经养了几年的按剩下的年份估" }, YUWA, { text: "一线 150 万为视频里的例子" }],
  },
  M: {
    refs: [
      { value: 200_000, label: "全国人均 20 万" },
      { value: 300_000, label: "30 万" },
      { value: 600_000, label: "60 万" },
      { value: 1_500_000, label: "一线家庭 150 万" },
    ],
    notes: [
      { text: "从今天起一辈子的医疗费预留" },
      { text: "视频粗估：人均约 20 万；二线 15–30 万、一线 30–60 万（未找到原始出处）" },
      { text: "一线家庭 150 万为视频里的例子" },
    ],
  },
  H: {
    refs: [
      { value: 1_200_000, label: "120 万" },
      { value: 3_000_000, label: "300 万" },
      { value: 7_000_000, label: "一线 700 万" },
    ],
    notes: [
      { text: "打算买房：填全款预算" },
      { text: "有房无贷（全款或已还清）、正在还房贷、一直租房都按 0 算；房贷月供和房租算进第 1 题的月开销" },
      { text: "一线 700 万为视频里的例子" },
    ],
  },
  rPct: {
    refs: [
      { value: 2, label: "2% 保守" },
      { value: 2.5, label: "2.5% 视频" },
      { value: 3, label: "3%" },
    ],
    notes: [
      { text: "已扣除通胀的实际收益率。视频：散户长期名义收益约 4%–4.5%，减去通胀约 2%，取 2.5%" },
      { text: "乘数 = 12 ÷ 实际收益率；2.5% 对应 480" },
    ],
  },
  A: {
    refs: [
      { value: 1_000_000, label: "100 万" },
      { value: 3_000_000, label: "300 万" },
      { value: 6_000_000, label: "600 万" },
      { value: 10_000_000, label: "1,000 万" },
    ],
    notes: [{ text: "能拿来投资的钱，不含自住房" }],
  },
} satisfies Record<string, FieldRefs>;

/** 视频一线中产例：1,870 万 */
export const VIDEO_EXAMPLE = { X: 15000, N: 2, K: 1_500_000, M: 1_500_000, H: 7_000_000 } as const;
