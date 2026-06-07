import { NextResponse } from "next/server";
import { fetchFundamentalSnapshot } from "@/lib/tushare";

/**
 * GET /api/market/fundamental?symbol=600519
 *
 * 返回最近一期财务快照（营收 / 净利 / 毛利率 / ROE + 同比）
 *
 * Response:
 *   FundamentalSnapshot              on success
 *   { error }                        on failure（含积分不足、无数据等）
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

    const snapshot = await fetchFundamentalSnapshot(symbol);

    return NextResponse.json(snapshot, {
      headers: {
        // 财报数据更新频率低，缓存 1 小时
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (err) {
    console.error("[api/market/fundamental] 失败:", err);
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json(
      { error: `财报拉取失败：${message}` },
      { status: 500 },
    );
  }
}
