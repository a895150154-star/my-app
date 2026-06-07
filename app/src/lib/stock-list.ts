/**
 * FIN AI · A 股大盘股名单（MVP 用）
 * 用于股票搜索 ⌘K 弹出菜单
 *
 * 仅包含散户最常关注的 100 只大盘股 + ETF + 指数
 * 真实产品应从 Tushare stock_basic 接口拉全市场
 */

export interface StockEntry {
  symbol: string;
  name: string;
  pinyin: string; // 拼音首字母
  industry?: string;
}

export const STOCK_LIST: StockEntry[] = [
  // 白酒
  { symbol: "600519", name: "贵州茅台", pinyin: "GZMT", industry: "白酒" },
  { symbol: "000858", name: "五粮液", pinyin: "WLY", industry: "白酒" },
  { symbol: "000568", name: "泸州老窖", pinyin: "LZLJ", industry: "白酒" },
  { symbol: "002304", name: "洋河股份", pinyin: "YHGF", industry: "白酒" },
  { symbol: "600809", name: "山西汾酒", pinyin: "SXFJ", industry: "白酒" },

  // 新能源
  { symbol: "300750", name: "宁德时代", pinyin: "NDSD", industry: "新能源" },
  { symbol: "002594", name: "比亚迪", pinyin: "BYD", industry: "新能源" },
  { symbol: "601012", name: "隆基绿能", pinyin: "LJLN", industry: "光伏" },
  { symbol: "002129", name: "TCL中环", pinyin: "TCLZH", industry: "光伏" },
  { symbol: "300274", name: "阳光电源", pinyin: "YGDY", industry: "光伏" },

  // 半导体
  { symbol: "688981", name: "中芯国际", pinyin: "ZXGJ", industry: "半导体" },
  { symbol: "688041", name: "海光信息", pinyin: "HGXX", industry: "半导体" },
  { symbol: "002371", name: "北方华创", pinyin: "BFHC", industry: "半导体" },
  { symbol: "603501", name: "韦尔股份", pinyin: "WEGF", industry: "半导体" },
  { symbol: "603986", name: "兆易创新", pinyin: "ZYCX", industry: "半导体" },

  // 金融
  { symbol: "601318", name: "中国平安", pinyin: "ZGPA", industry: "金融" },
  { symbol: "601398", name: "工商银行", pinyin: "GSYH", industry: "银行" },
  { symbol: "601288", name: "农业银行", pinyin: "NYYH", industry: "银行" },
  { symbol: "600036", name: "招商银行", pinyin: "ZSYH", industry: "银行" },
  { symbol: "600030", name: "中信证券", pinyin: "ZXZQ", industry: "证券" },

  // 家电
  { symbol: "000333", name: "美的集团", pinyin: "MDJT", industry: "家电" },
  { symbol: "000651", name: "格力电器", pinyin: "GLDQ", industry: "家电" },
  { symbol: "600690", name: "海尔智家", pinyin: "HEZJ", industry: "家电" },

  // 医药
  { symbol: "300760", name: "迈瑞医疗", pinyin: "MRYL", industry: "医疗器械" },
  { symbol: "600276", name: "恒瑞医药", pinyin: "HRYY", industry: "医药" },
  { symbol: "603259", name: "药明康德", pinyin: "YMKD", industry: "医药" },
  { symbol: "300015", name: "爱尔眼科", pinyin: "AEYK", industry: "医疗服务" },

  // 互联网/AI
  { symbol: "002230", name: "科大讯飞", pinyin: "KDXF", industry: "AI" },
  { symbol: "300033", name: "同花顺", pinyin: "THS", industry: "金融科技" },
  { symbol: "002415", name: "海康威视", pinyin: "HKWS", industry: "AI" },
  { symbol: "000063", name: "中兴通讯", pinyin: "ZXTX", industry: "通信" },

  // 资源
  { symbol: "601899", name: "紫金矿业", pinyin: "ZJKY", industry: "黄金" },
  { symbol: "600362", name: "江西铜业", pinyin: "JXTY", industry: "有色金属" },
  { symbol: "603799", name: "华友钴业", pinyin: "HYGY", industry: "有色金属" },
  { symbol: "601857", name: "中国石油", pinyin: "ZGSY", industry: "石油" },
  { symbol: "600028", name: "中国石化", pinyin: "ZGSH", industry: "石油" },

  // 食品饮料
  { symbol: "600887", name: "伊利股份", pinyin: "YLGF", industry: "乳业" },
  { symbol: "603288", name: "海天味业", pinyin: "HTWY", industry: "调味品" },
  { symbol: "603259", name: "药明康德", pinyin: "YMKD", industry: "医药" },

  // 汽车
  { symbol: "601127", name: "赛力斯", pinyin: "SLS", industry: "新能源车" },
  { symbol: "600104", name: "上汽集团", pinyin: "SQJT", industry: "汽车" },
  { symbol: "601633", name: "长城汽车", pinyin: "CCQC", industry: "汽车" },

  // 房地产
  { symbol: "000002", name: "万科A", pinyin: "WKA", industry: "地产" },
  { symbol: "600048", name: "保利发展", pinyin: "BLFZ", industry: "地产" },

  // 消费
  { symbol: "603605", name: "珀莱雅", pinyin: "PLY", industry: "美妆" },
  { symbol: "603833", name: "欧派家居", pinyin: "OPJJ", industry: "家居" },

  // 电力
  { symbol: "600900", name: "长江电力", pinyin: "CJDL", industry: "电力" },
  { symbol: "601985", name: "中国核电", pinyin: "ZGHD", industry: "核电" },

  // 军工
  { symbol: "600760", name: "中航沈飞", pinyin: "ZHSF", industry: "军工" },
  { symbol: "600893", name: "航发动力", pinyin: "HFDL", industry: "军工" },

  // 化工
  { symbol: "600309", name: "万华化学", pinyin: "WHHX", industry: "化工" },
  { symbol: "002648", name: "卫星化学", pinyin: "WXHX", industry: "化工" },

  // 物流
  { symbol: "002352", name: "顺丰控股", pinyin: "SFKG", industry: "物流" },

  // 农林牧渔
  { symbol: "000895", name: "双汇发展", pinyin: "SHFZ", industry: "肉制品" },
  { symbol: "000876", name: "新希望", pinyin: "XXW", industry: "养殖" },

  // 主要指数
  { symbol: "000001", name: "上证指数", pinyin: "SZZS", industry: "指数" },
  { symbol: "399001", name: "深证成指", pinyin: "SZCZ", industry: "指数" },
  { symbol: "399006", name: "创业板指", pinyin: "CYBZ", industry: "指数" },
  { symbol: "000300", name: "沪深300", pinyin: "HS300", industry: "指数" },
  { symbol: "000905", name: "中证500", pinyin: "ZZ500", industry: "指数" },
];

/**
 * 模糊匹配
 * 命中：code 前缀 / 名称包含 / 拼音首字母前缀
 */
export function searchStocks(query: string, limit = 10): StockEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const exactCode: StockEntry[] = [];
  const codePrefix: StockEntry[] = [];
  const nameMatch: StockEntry[] = [];
  const pinyinMatch: StockEntry[] = [];

  for (const stock of STOCK_LIST) {
    const code = stock.symbol;
    const name = stock.name;
    const pinyin = stock.pinyin.toLowerCase();

    if (code === q) exactCode.push(stock);
    else if (code.startsWith(q)) codePrefix.push(stock);
    else if (name.includes(query)) nameMatch.push(stock);
    else if (pinyin.startsWith(q)) pinyinMatch.push(stock);
  }

  return [...exactCode, ...codePrefix, ...nameMatch, ...pinyinMatch].slice(
    0,
    limit,
  );
}

export function findStock(symbol: string): StockEntry | undefined {
  return STOCK_LIST.find((s) => s.symbol === symbol);
}
