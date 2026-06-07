/**
 * FIN AI · Tushare A 股行情客户端
 *
 * Tushare 是开源金融数据接口，免费版 20 积分即可拉：
 * - 日线 K 线（daily）
 * - 股票列表（stock_basic）
 *
 * API 协议：HTTP POST，单一 endpoint，用 api_name 区分接口
 * 文档：https://tushare.pro/document/2
 *
 * 按 CLAUDE.md 约束：价格单位用"分"（整数），从 Tushare 拿到的元为单位需 *100 转换
 */

const TUSHARE_URL = process.env.TUSHARE_API_URL ?? "http://api.tushare.pro";
const TUSHARE_TOKEN = process.env.TUSHARE_TOKEN;

if (!TUSHARE_TOKEN) {
  console.warn("[tushare] TUSHARE_TOKEN 未配置 —— 请检查 app/.env.local");
}

interface TushareResponse<T> {
  code: number;
  msg: string;
  data: {
    fields: string[];
    items: T[][];
  } | null;
}

async function callTushare<T>(
  apiName: string,
  params: Record<string, unknown>,
  fields: string,
): Promise<T[]> {
  if (!TUSHARE_TOKEN) {
    throw new Error("TUSHARE_TOKEN 未配置");
  }

  const res = await fetch(TUSHARE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_name: apiName,
      token: TUSHARE_TOKEN,
      params,
      fields,
    }),
    // 服务端调用，绕过 CORS，不要在浏览器直连
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Tushare HTTP ${res.status}`);
  }

  const json = (await res.json()) as TushareResponse<unknown>;
  if (json.code !== 0) {
    throw new Error(`Tushare API 错误：${json.msg ?? "未知错误"}`);
  }
  if (!json.data) return [];

  // 把 [[v1, v2, ...], ...] 按 fields 转换为对象数组
  const fieldList = json.data.fields;
  return json.data.items.map((row) => {
    const obj: Record<string, unknown> = {};
    fieldList.forEach((f, idx) => {
      obj[f] = row[idx];
    });
    return obj as T;
  });
}

// ============================================================
// Daily K-line
// ============================================================

export interface KlinePoint {
  /** YYYY-MM-DD */
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  /** 单位：手（100 股） */
  volume: number;
  /** 涨跌幅（百分比） */
  changePercent: number;
}

interface TushareDailyRow {
  ts_code: string;
  trade_date: string; // YYYYMMDD
  open: number;
  high: number;
  low: number;
  close: number;
  pre_close: number;
  change: number;
  pct_chg: number; // 百分比
  vol: number; // 单位：手
  amount: number; // 单位：千元
}

/**
 * 拉某只股票的日线 K
 *
 * @param symbol 6 位代码，如 "600519"
 * @param limit 拉多少根，默认 120 根（约半年）
 */
export async function fetchDailyKline(
  symbol: string,
  limit = 120,
): Promise<KlinePoint[]> {
  const ts_code = toTsCode(symbol);

  const rows = await callTushare<TushareDailyRow>(
    "daily",
    { ts_code, limit },
    "ts_code,trade_date,open,high,low,close,pre_close,change,pct_chg,vol,amount",
  );

  // Tushare 返回是倒序（最新在前），翻转为正序便于图表绘制
  return rows
    .map((r) => ({
      time: formatDate(r.trade_date),
      open: r.open,
      high: r.high,
      low: r.low,
      close: r.close,
      volume: r.vol,
      changePercent: r.pct_chg,
    }))
    .reverse();
}

/**
 * 拉最新一条日线作为"最新价"
 * 注：Tushare 免费版没有真实时数据，盘中拉到的是昨日收盘。
 *     如果是盘中（9:30-15:00），可以叠加新浪/腾讯实时接口；这里先用日线兜底。
 */
export async function fetchLatestQuote(symbol: string): Promise<{
  symbol: string;
  /** 价格单位：分 */
  priceCents: number;
  /** 涨跌额：分 */
  changeCents: number;
  changePercent: number;
  /** 单位：手 */
  volume: number;
  tradeDate: string;
}> {
  const ts_code = toTsCode(symbol);

  const rows = await callTushare<TushareDailyRow>(
    "daily",
    { ts_code, limit: 1 },
    "ts_code,trade_date,open,high,low,close,pre_close,change,pct_chg,vol,amount",
  );

  if (rows.length === 0) {
    throw new Error(`未找到 ${symbol} 的行情数据`);
  }

  const row = rows[0];
  return {
    symbol,
    priceCents: Math.round(row.close * 100),
    changeCents: Math.round(row.change * 100),
    changePercent: row.pct_chg,
    volume: row.vol,
    tradeDate: formatDate(row.trade_date),
  };
}

// ============================================================
// Fundamental（财务指标快照）
// ============================================================

export interface FundamentalSnapshot {
  symbol: string;
  /** 报告期 YYYY-MM-DD（季报末日） */
  period: string;
  /** 营业收入（元） */
  revenue: number | null;
  /** 营收同比（%） */
  revenueYoY: number | null;
  /** 归母净利润（元） */
  netProfit: number | null;
  /** 净利同比（%） */
  netProfitYoY: number | null;
  /** 销售毛利率（%） */
  grossMargin: number | null;
  /** 净资产收益率（%） */
  roe: number | null;
  /** 数据源标签 */
  source: string;
}

interface TushareFinaIndicatorRow {
  ts_code: string;
  ann_date: string;
  end_date: string;
  roe: number | null;
  grossprofit_margin: number | null;
  netprofit_yoy: number | null;
  or_yoy: number | null;
}

interface TushareIncomeRow {
  ts_code: string;
  end_date: string;
  revenue: number | null;
  n_income_attr_p: number | null;
}

/**
 * 拉某只股票最近一期的财务指标快照
 *
 * 数据来源：Tushare 的 fina_indicator + income 两个接口
 * 积分要求：fina_indicator 需要 120+ 积分；income 也是 120+
 * 如果账户积分不足，调用会 throw（外层兜底转 mock）
 */
export async function fetchFundamentalSnapshot(
  symbol: string,
): Promise<FundamentalSnapshot> {
  const ts_code = toTsCode(symbol);

  const [indicatorRows, incomeRows] = await Promise.all([
    callTushare<TushareFinaIndicatorRow>(
      "fina_indicator",
      { ts_code, limit: 1 },
      "ts_code,ann_date,end_date,roe,grossprofit_margin,netprofit_yoy,or_yoy",
    ),
    callTushare<TushareIncomeRow>(
      "income",
      { ts_code, limit: 1 },
      "ts_code,end_date,revenue,n_income_attr_p",
    ),
  ]);

  const ind = indicatorRows[0];
  const inc = incomeRows[0];
  const endDate = ind?.end_date ?? inc?.end_date;

  if (!endDate) {
    throw new Error(`未找到 ${symbol} 的财务数据`);
  }

  return {
    symbol,
    period: formatDate(endDate),
    revenue: inc?.revenue ?? null,
    revenueYoY: ind?.or_yoy ?? null,
    netProfit: inc?.n_income_attr_p ?? null,
    netProfitYoY: ind?.netprofit_yoy ?? null,
    grossMargin: ind?.grossprofit_margin ?? null,
    roe: ind?.roe ?? null,
    source: "Tushare · 巨潮资讯",
  };
}

// ============================================================
// Quote Card（行情卡：现价 + 量比 + 换手率 + 振幅）
// ============================================================

export interface QuoteCardSnapshot {
  symbol: string;
  /** YYYY-MM-DD */
  tradeDate: string;
  /** 价格单位：分 */
  priceCents: number;
  /** 涨跌额：分 */
  changeCents: number;
  /** 涨跌幅（%） */
  changePercent: number;
  /** 振幅（%） —— (high - low) / pre_close * 100 */
  amplitudePercent: number;
  /** 换手率（%） */
  turnoverRate: number | null;
  /** 量比 */
  volumeRatio: number | null;
  /** 成交量（手） */
  volume: number;
  /** 成交额（千元） */
  amount: number;
  /** 数据源标签 */
  source: string;
}

interface TushareDailyBasicRow {
  ts_code: string;
  trade_date: string;
  close: number | null;
  turnover_rate: number | null;
  turnover_rate_f: number | null;
  volume_ratio: number | null;
  pe: number | null;
  pe_ttm: number | null;
  pb: number | null;
  ps: number | null;
  ps_ttm: number | null;
  dv_ratio: number | null;
  dv_ttm: number | null;
  total_share: number | null; // 总股本（万股）
  float_share: number | null; // 流通股本（万股）
  free_share: number | null; // 自由流通股本（万股）
  total_mv: number | null; // 总市值（万元）
  circ_mv: number | null; // 流通市值（万元）
}

export async function fetchQuoteCard(
  symbol: string,
): Promise<QuoteCardSnapshot> {
  const ts_code = toTsCode(symbol);

  const [dailyRows, basicRows] = await Promise.all([
    callTushare<TushareDailyRow>(
      "daily",
      { ts_code, limit: 1 },
      "ts_code,trade_date,open,high,low,close,pre_close,change,pct_chg,vol,amount",
    ),
    callTushare<TushareDailyBasicRow>(
      "daily_basic",
      { ts_code, limit: 1 },
      "ts_code,trade_date,close,turnover_rate,turnover_rate_f,volume_ratio",
    ),
  ]);

  if (dailyRows.length === 0) {
    throw new Error(`未找到 ${symbol} 的行情`);
  }
  const d = dailyRows[0];
  const b = basicRows[0];

  const amplitude =
    d.pre_close && d.pre_close > 0
      ? ((d.high - d.low) / d.pre_close) * 100
      : 0;

  return {
    symbol,
    tradeDate: formatDate(d.trade_date),
    priceCents: Math.round(d.close * 100),
    changeCents: Math.round(d.change * 100),
    changePercent: d.pct_chg,
    amplitudePercent: amplitude,
    turnoverRate: b?.turnover_rate ?? null,
    volumeRatio: b?.volume_ratio ?? null,
    volume: d.vol,
    amount: d.amount,
    source: "Tushare · 上交所/深交所",
  };
}

// ============================================================
// Valuation Card（估值卡：PE / PB / PS / 市值 / 股息率）
// ============================================================

export interface ValuationSnapshot {
  symbol: string;
  tradeDate: string;
  pe: number | null;
  peTtm: number | null;
  pb: number | null;
  ps: number | null;
  psTtm: number | null;
  /** 股息率（%） */
  dvRatio: number | null;
  dvTtm: number | null;
  /** 总市值（元） */
  totalMv: number | null;
  /** 流通市值（元） */
  circMv: number | null;
  /** 总股本（股） */
  totalShare: number | null;
  /** 流通股本（股） */
  floatShare: number | null;
  source: string;
}

export async function fetchValuationSnapshot(
  symbol: string,
): Promise<ValuationSnapshot> {
  const ts_code = toTsCode(symbol);
  const rows = await callTushare<TushareDailyBasicRow>(
    "daily_basic",
    { ts_code, limit: 1 },
    "ts_code,trade_date,pe,pe_ttm,pb,ps,ps_ttm,dv_ratio,dv_ttm,total_share,float_share,total_mv,circ_mv",
  );

  if (rows.length === 0) {
    throw new Error(`未找到 ${symbol} 的估值数据`);
  }
  const r = rows[0];

  return {
    symbol,
    tradeDate: formatDate(r.trade_date),
    pe: r.pe,
    peTtm: r.pe_ttm,
    pb: r.pb,
    ps: r.ps,
    psTtm: r.ps_ttm,
    dvRatio: r.dv_ratio,
    dvTtm: r.dv_ttm,
    // 万元 → 元
    totalMv: r.total_mv != null ? r.total_mv * 1e4 : null,
    circMv: r.circ_mv != null ? r.circ_mv * 1e4 : null,
    // 万股 → 股
    totalShare: r.total_share != null ? r.total_share * 1e4 : null,
    floatShare: r.float_share != null ? r.float_share * 1e4 : null,
    source: "Tushare · daily_basic",
  };
}

// ============================================================
// Top 10 流通股东（股东结构）
// ============================================================

export interface HolderRow {
  /** 股东名称 */
  holderName: string;
  /** 持股数（股） */
  holdAmount: number | null;
  /** 持股比例（%） */
  holdRatio: number | null;
  /** 变动数量（股，正数加仓，负数减仓） */
  holdChange: number | null;
}

export interface HoldersSnapshot {
  symbol: string;
  /** 报告期 YYYY-MM-DD */
  endDate: string;
  holders: HolderRow[];
  source: string;
}

interface TushareTop10HolderRow {
  ts_code: string;
  ann_date: string;
  end_date: string;
  holder_name: string;
  hold_amount: number | null;
  hold_ratio: number | null;
  hold_change: number | null;
}

export async function fetchTop10FloatHolders(
  symbol: string,
): Promise<HoldersSnapshot> {
  const ts_code = toTsCode(symbol);
  const rows = await callTushare<TushareTop10HolderRow>(
    "top10_floatholders",
    { ts_code },
    "ts_code,ann_date,end_date,holder_name,hold_amount,hold_ratio,hold_change",
  );

  if (rows.length === 0) {
    throw new Error(`未找到 ${symbol} 的流通股东数据`);
  }

  // 只取最新一期报告
  const latestEndDate = rows.reduce(
    (max, r) => (r.end_date > max ? r.end_date : max),
    rows[0].end_date,
  );
  const latest = rows.filter((r) => r.end_date === latestEndDate);

  return {
    symbol,
    endDate: formatDate(latestEndDate),
    holders: latest.slice(0, 10).map((r) => ({
      holderName: r.holder_name,
      holdAmount: r.hold_amount,
      holdRatio: r.hold_ratio,
      holdChange: r.hold_change,
    })),
    source: "Tushare · top10_floatholders",
  };
}

// ============================================================
// Util
// ============================================================

/**
 * 6 位代码 → Tushare ts_code（带交易所后缀）
 *   600519 → 600519.SH
 *   000333 → 000333.SZ
 *   300750 → 300750.SZ
 *   688981 → 688981.SH
 */
function toTsCode(symbol: string): string {
  const first = symbol[0];
  // 沪市：6 开头主板、688 科创板
  if (first === "6") return `${symbol}.SH`;
  // 深市：000 主板、002 中小板、300 创业板
  if (first === "0" || first === "3") return `${symbol}.SZ`;
  // 北交所：8 开头
  if (first === "8" || first === "4") return `${symbol}.BJ`;
  // 默认沪市
  return `${symbol}.SH`;
}

/**
 * YYYYMMDD → YYYY-MM-DD
 */
function formatDate(yyyymmdd: string): string {
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}
