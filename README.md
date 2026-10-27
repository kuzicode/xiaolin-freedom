# 财富自由计算器

按小Lin说《你需要多少钱，才能财富自由？》视频公式做的纯前端计算器：回答 4 个问题，算出你自己的数。

- 在线使用：https://calc.freedomrich.xyz
- 公式出处：https://www.bilibili.com/video/BV1yUHP6rEYD （本项目为非官方工具）
- 计算都在浏览器里完成，不上传任何数据，没有统计和埋点

## 公式

```
财富自由临界值 = (12 / r) × 月开销 + 每孩成本 × 孩子数 + 医疗 + 住房
```

`r` 是已扣除通胀的实际收益率，默认 2.5%，对应乘数 480。

| 输入 | 期望输出 |
| --- | --- |
| 月开销 1 万，其余为 0 | 480 万（4% 法则为 300 万） |
| 月开销 1.5 万，每孩 150 万 × 2，医疗 150 万，住房 700 万 | 1,870 万（视频一线例） |
| 已有 600 万，每孩 70 万 × 1，医疗 50 万，租房 | 每月约可花 1 万 |

## 本地运行

```bash
npm install
npm run dev        # 开发服务器
npm test           # 单测
npm run typecheck
npm run health     # 死代码 / 重复代码报告
npm run build      # 静态产物 → dist/
```

## 目录

```
src/core/   计算核心：calc.ts · parse.ts（输入解析）· refs.ts（参考值与出处）
src/web/    网页：index.html · main.ts · state.ts · views/ · style.css
test/       vitest
```

## 免责

简化模型，未考虑投资波动、税和费用，不构成投资建议。
