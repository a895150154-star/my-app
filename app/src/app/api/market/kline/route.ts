import { NextResponse } from "next/server";
import { fetchDailyKline } from "@/lib/tushare";

/**
 * GET /api/market/kline?symbol=600519&limit=120
 *
 * Response:
 *   { symbol, points: KlinePoint[] }  on success
 *   { error }                          on failure (HTTP 4xx/5xx)
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const symbol = url.searchParams.get("symbol")?.trim();
    const limitParam = url.searchParams.get("limit");

    if (!symbol || !/^\d{6}$/.test(symbol)) {
      return NextResponse.json(
        { error: "symbol 必须是 6 位股票代码（如 600519）" },
        { status: 400 },
      );
    }

    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 120, 5), 500) : 120;

    const points = await fetchDailyKline(symbol, limit);

    return NextResponse.json(
      { symbol, points },
      {
        headers: {
          // 客户端缓存 60 秒，盘后/周末更长
          "Cache-Control": "public, max-age=60, s-maxage=60",
        },
      },
    );
  } catch (err) {
    console.error("[api/market/kline] 失败:", err);
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json(
      { error: `行情拉取失败：${message}` },
      { status: 500 },
    );
  }
}
