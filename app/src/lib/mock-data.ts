import { MarketData, KnowledgeItem } from "@/types";

/**
 * A 股个股 mock 数据
 * priceCents 单位：分（按 CLAUDE.md「金融数据用整数」约束）
 * 例：贵州茅台 1685.00 元 = 168500 分
 */
export const mockMarketData: MarketData[] = [
  {
    symbol: "600519",
    name: "贵州茅台",
    priceCents: 168500,
    changeCents: 1250,
    changePercent: 0.75,
    volume: 3482000,
    timestamp: "2026-05-22T14:30:00+08:00",
    source: "上交所 · 实时行情",
  },
  {
    symbol: "300750",
    name: "宁德时代",
    priceCents: 24530,
    changeCents: -185,
    changePercent: -0.75,
    volume: 21450000,
    timestamp: "2026-05-22T14:30:00+08:00",
    source: "深交所 · 实时行情",
  },
  {
    symbol: "002594",
    name: "比亚迪",
    priceCents: 23420,
    changeCents: 320,
    changePercent: 1.38,
    volume: 56700000,
    timestamp: "2026-05-22T14:30:00+08:00",
    source: "深交所 · 实时行情",
  },
  {
    symbol: "688981",
    name: "中芯国际",
    priceCents: 8910,
    changeCents: 68,
    changePercent: 0.77,
    volume: 42300000,
    timestamp: "2026-05-22T14:30:00+08:00",
    source: "上交所 · 科创板",
  },
  {
    symbol: "000333",
    name: "美的集团",
    priceCents: 7256,
    changeCents: -115,
    changePercent: -1.56,
    volume: 18900000,
    timestamp: "2026-05-22T14:30:00+08:00",
    source: "深交所 · 实时行情",
  },
  {
    symbol: "601318",
    name: "中国平安",
    priceCents: 5128,
    changeCents: 180,
    changePercent: 3.64,
    volume: 67200000,
    timestamp: "2026-05-22T14:30:00+08:00",
    source: "上交所 · 实时行情",
  },
  {
    symbol: "000858",
    name: "五粮液",
    priceCents: 15820,
    changeCents: 245,
    changePercent: 1.57,
    volume: 12450000,
    timestamp: "2026-05-22T14:30:00+08:00",
    source: "深交所 · 实时行情",
  },
  {
    symbol: "601899",
    name: "紫金矿业",
    priceCents: 1842,
    changeCents: 38,
    changePercent: 2.11,
    volume: 89320000,
    timestamp: "2026-05-22T14:30:00+08:00",
    source: "上交所 · 实时行情",
  },
];

/**
 * 现货商品 mock 数据
 * priceCents 单位：分（按 CLAUDE.md「金融数据用整数」约束）
 * 例：镁合金 16850 元/吨 = 1685000 分
 *
 * 体现 FIN AI「方法论标的中性」—— 同一套 Agent Loop 流程兼容股票与现货
 */
export const mockCommodityData: MarketData[] = [
  {
    symbol: "MG2406",
    name: "镁合金 2406",
    priceCents: 1685000,
    changeCents: 12500,
    changePercent: 0.75,
    volume: 34820,
    timestamp: "2026-05-22T14:30:00+08:00",
    source: "东北亚镁质交易所",
  },
  {
    symbol: "MG2409",
    name: "镁合金 2409",
    priceCents: 1712000,
    changeCents: -8500,
    changePercent: -0.49,
    volume: 21450,
    timestamp: "2026-05-22T14:30:00+08:00",
    source: "东北亚镁质交易所",
  },
  {
    symbol: "MgO2406",
    name: "氧化镁 2406",
    priceCents: 234500,
    changeCents: 3200,
    changePercent: 1.38,
    volume: 56700,
    timestamp: "2026-05-22T14:30:00+08:00",
    source: "东北亚镁质交易所",
  },
  {
    symbol: "MgO2409",
    name: "氧化镁 2409",
    priceCents: 241000,
    changeCents: 1800,
    changePercent: 0.75,
    volume: 42300,
    timestamp: "2026-05-22T14:30:00+08:00",
    source: "东北亚镁质交易所",
  },
  {
    symbol: "SiMg2406",
    name: "硅镁合金 2406",
    priceCents: 985000,
    changeCents: -15600,
    changePercent: -1.56,
    volume: 18900,
    timestamp: "2026-05-22T14:30:00+08:00",
    source: "东北亚镁质交易所",
  },
  {
    symbol: "MgCl2406",
    name: "氯化镁 2406",
    priceCents: 128000,
    changeCents: 4500,
    changePercent: 3.64,
    volume: 67200,
    timestamp: "2026-05-22T14:30:00+08:00",
    source: "东北亚镁质交易所",
  },
];

/**
 * 现货商品对应的研报/舆情 mock
 */
export const mockCommodityKnowledge: KnowledgeItem[] = [
  {
    id: "cb-001",
    title: "镁合金市场周度研判（第 21 周）",
    content:
      "本周镁合金现货价格整体偏强运行，主因上游原料端受环保限产影响供给收缩。短期内价格有望维持在 16500-17200 区间震荡，关注下周环保督查进展。本研判仅供参考，不构成交易建议。",
    author: "张明远（首席分析师）",
    category: "research",
    createdAt: "2026-05-20T09:00:00+08:00",
    expiresAt: "2026-05-27T09:00:00+08:00",
    tags: ["镁合金", "周报", "偏多"],
  },
  {
    id: "cb-002",
    title: "氧化镁产业链舆情追踪",
    content:
      "近期海城地区部分氧化镁生产企业因环保不达标被要求停产整顿，涉及产能约 8 万吨/年，占全国总产能的 3.2%。市场情绪偏紧，预计短期对氧化镁价格形成支撑。",
    author: "李婷（舆情分析）",
    category: "sentiment",
    createdAt: "2026-05-21T15:30:00+08:00",
    expiresAt: "2026-05-28T15:30:00+08:00",
    tags: ["氧化镁", "环保", "舆情"],
  },
  {
    id: "cb-003",
    title: "异动预警：氯化镁单日涨幅 3.64%",
    content:
      "MgCl2406 合约今日涨幅超 3.5%，触发波动预警。主因市场传闻某大型贸易商大量囤货，尚未得到证实。建议散户客户谨慎追高，等待回调确认后再综合判断。仅供参考。",
    author: "系统自动生成",
    category: "alert",
    createdAt: "2026-05-22T14:00:00+08:00",
    expiresAt: "2026-05-22T20:00:00+08:00",
    tags: ["氯化镁", "风险", "异动"],
  },
];

/**
 * 主要指数 mock 数据（散户工作台常驻 widget）
 */
export const mockIndexData: MarketData[] = [
  {
    symbol: "000001",
    name: "上证指数",
    priceCents: 318562,
    changeCents: 1842,
    changePercent: 0.58,
    volume: 0,
    timestamp: "2026-05-22T14:30:00+08:00",
    source: "中证指数",
  },
  {
    symbol: "399001",
    name: "深证成指",
    priceCents: 1024380,
    changeCents: -3420,
    changePercent: -0.33,
    volume: 0,
    timestamp: "2026-05-22T14:30:00+08:00",
    source: "深交所",
  },
  {
    symbol: "399006",
    name: "创业板指",
    priceCents: 215840,
    changeCents: 2180,
    changePercent: 1.02,
    volume: 0,
    timestamp: "2026-05-22T14:30:00+08:00",
    source: "深交所",
  },
  {
    symbol: "000300",
    name: "沪深300",
    priceCents: 380125,
    changeCents: 1245,
    changePercent: 0.33,
    volume: 0,
    timestamp: "2026-05-22T14:30:00+08:00",
    source: "中证指数",
  },
];

/**
 * 知识库 mock：覆盖研报 / 舆情 / 策略 / 异动预警 4 类
 */
export const mockKnowledgeItems: KnowledgeItem[] = [
  {
    id: "kb-001",
    title: "贵州茅台 2026Q1 财报点评：业绩稳健，量价齐升",
    content:
      "茅台 Q1 营收 514 亿元同比增长 18.0%，归母净利润 268 亿元同比增长 16.2%。直营渠道占比提升至 46%，盈利能力增强。当前估值 PE-TTM 处于近 5 年 30% 分位，安全边际较为充分。中长期持有逻辑未变，短期受白酒板块情绪影响存在波动。",
    author: "张明远（首席分析师）",
    category: "research",
    createdAt: "2026-05-20T09:00:00+08:00",
    expiresAt: "2026-08-20T09:00:00+08:00",
    tags: ["贵州茅台", "财报", "白酒", "中长期"],
  },
  {
    id: "kb-002",
    title: "宁德时代舆情追踪：欧洲新工厂落地传闻",
    content:
      "市场流传宁德时代将在匈牙利投建第二座工厂，规划产能 80GWh。若属实，将进一步巩固其全球动力电池龙头地位。目前公司未做正式回应，建议关注下周公告。情绪面短期偏多，但需警惕传闻证伪风险。",
    author: "李婷（舆情分析）",
    category: "sentiment",
    createdAt: "2026-05-21T15:30:00+08:00",
    expiresAt: "2026-05-28T15:30:00+08:00",
    tags: ["宁德时代", "新能源", "舆情", "海外"],
  },
  {
    id: "kb-003",
    title: "比亚迪技术面：放量突破前高，多头格局明确",
    content:
      "比亚迪今日放量上涨 1.38%，成交额 132 亿元，突破近 3 个月震荡平台上沿。MACD 金叉、KDJ 同向上行、布林带开口走阔。若后续能站稳 235 元，技术面看至 250 元一线。但需注意：此为技术面观察，非买卖建议，请结合基本面与个人风险偏好判断。",
    author: "王凯（策略分析师）",
    category: "strategy",
    createdAt: "2026-05-22T08:30:00+08:00",
    expiresAt: "2026-05-26T15:00:00+08:00",
    tags: ["比亚迪", "技术面", "突破"],
  },
  {
    id: "kb-004",
    title: "异动预警：中国平安单日涨幅 3.64%",
    content:
      "中国平安今日涨幅 3.64%，成交额放大至 86 亿元（近 20 日均值的 2.3 倍）。主因：1）央行降准消息引发金融板块普涨；2）公司上周宣布回购方案，已实施 12 亿元。属于板块联动 + 公司利好双重驱动，但短期涨幅已较大，散户追高需谨慎。",
    author: "系统自动生成",
    category: "alert",
    createdAt: "2026-05-22T14:00:00+08:00",
    expiresAt: "2026-05-23T20:00:00+08:00",
    tags: ["中国平安", "金融", "异动", "降准"],
  },
  {
    id: "kb-005",
    title: "中芯国际：先进制程进展点评",
    content:
      "据产业链调研，中芯国际 N+2 制程良率持续提升，预计 2026 下半年贡献营收。半导体国产替代主线下，公司作为晶圆代工龙头长期受益。但需关注：1）海外设备进口限制；2）行业周期波动。当前股价反映了部分预期，估值需理性看待。",
    author: "陈雪（行业研究）",
    category: "research",
    createdAt: "2026-05-22T10:15:00+08:00",
    expiresAt: "2026-07-22T10:15:00+08:00",
    tags: ["中芯国际", "半导体", "国产替代"],
  },
  {
    id: "kb-006",
    title: "宏观面：央行降准 0.5pct 落地，流动性宽松",
    content:
      "央行宣布于 5 月 20 日下调金融机构存款准备金率 0.5 个百分点，释放长期资金约 1 万亿。历史上降准后 1 个月内，沪深 300 上涨概率 67%。受益板块：金融、地产、基建。但宏观利好需观察基本面跟进情况，不代表立即上涨。",
    author: "宏观研究组",
    category: "research",
    createdAt: "2026-05-20T18:00:00+08:00",
    expiresAt: "2026-06-20T18:00:00+08:00",
    tags: ["宏观", "降准", "流动性", "金融板块"],
  },
];

/**
 * 价格格式化：分 → 元，保留两位小数 + 千分位
 */
export function formatPrice(priceCents: number): string {
  return (priceCents / 100).toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * 成交量格式化：股 → 万股 / 亿股
 */
export function formatVolume(volume: number): string {
  if (volume >= 100000000) {
    return (volume / 100000000).toFixed(2) + " 亿股";
  }
  if (volume >= 10000) {
    return (volume / 10000).toFixed(1) + " 万股";
  }
  return volume.toLocaleString("zh-CN");
}

/**
 * 涨跌幅格式化：带符号
 */
export function formatChangePercent(pct: number): string {
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

/**
 * 涨跌金额格式化：分 → 元，带符号
 */
export function formatChangeCents(cents: number): string {
  const sign = cents > 0 ? "+" : "";
  return `${sign}${(cents / 100).toFixed(2)}`;
}
