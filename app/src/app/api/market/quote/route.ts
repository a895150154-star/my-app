import { NextResponse } from "next/server";
import { fetchLatestQuote } from "@/lib/tushare";

/**
 * GET /api/market/quote?symbol=600519
 *
 * Response:
 *   { symbol, priceCents, changeCents, changePercent, volume, tradeDate } on success
 *   { error }                                                             on failure
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

    const quote = await fetchLatestQuote(symbol);

    return NextResponse.json(quote, {
      headers: {
        // 30 秒缓存，对齐前端轮询频率
        "Cache-Control": "public, max-age=30, s-maxage=30",
      },
    });
  } catch (err) {
    console.error("[api/market/quote] 失败:", err);
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json(
      { error: `行情拉取失败：${message}` },
      { status: 500 },
    );
  }
}
