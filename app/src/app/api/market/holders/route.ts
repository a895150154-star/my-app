import { NextResponse } from "next/server";
import { fetchTop10FloatHolders } from "@/lib/tushare";

/**
 * GET /api/market/holders?symbol=600519
 * 返回最近一期 top 10 流通股东
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
    const snap = await fetchTop10FloatHolders(symbol);
    return NextResponse.json(snap, {
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600" },
    });
  } catch (err) {
    console.error("[api/market/holders] 失败:", err);
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json(
      { error: `股东数据拉取失败：${message}` },
      { status: 500 },
    );
  }
}
