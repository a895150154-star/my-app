import { NextResponse } from "next/server";
import { fetchQuoteCard } from "@/lib/tushare";

/**
 * GET /api/market/quote-card?symbol=600519
 * 返回行情卡数据：现价 + 涨跌 + 量比 + 换手率 + 振幅
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const symbol = url.searchParams.get("symbol")?.trim();
    if (!symbol || !/^\d{6}$/.test(symbol)) {
      return NextResponse.json(
        { error: "symbol 必须是 6 位股票代码" },
        { status: 400 },
      );
    }
    const snap = await fetchQuoteCard(symbol);
    return NextResponse.json(snap, {
      headers: { "Cache-Control": "public, max-age=30, s-maxage=30" },
    });
  } catch (err) {
    console.error("[api/market/quote-card] 失败:", err);
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json(
      { error: `行情卡拉取失败：${message}` },
      { status: 500 },
    );
  }
}
