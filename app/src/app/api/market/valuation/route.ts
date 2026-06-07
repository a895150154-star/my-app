import { NextResponse } from "next/server";
import { fetchValuationSnapshot } from "@/lib/tushare";

/**
 * GET /api/market/valuation?symbol=600519
 * 返回估值卡：PE / PB / PS / 市值 / 股息率
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
    const snap = await fetchValuationSnapshot(symbol);
    return NextResponse.json(snap, {
      headers: { "Cache-Control": "public, max-age=300, s-maxage=300" },
    });
  } catch (err) {
    console.error("[api/market/valuation] 失败:", err);
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json(
      { error: `估值数据拉取失败：${message}` },
      { status: 500 },
    );
  }
}
