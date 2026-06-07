import MarketCard from "@/components/MarketCard";
import { mockMarketData, formatPrice, formatVolume } from "@/lib/mock-data";

export default function MarketPage() {
  return (
    <div>
      <header className="px-10 py-10 border-b border-[var(--border)] bg-grid relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-glow opacity-50" />
        <div className="relative">
          <p className="text-[10px] uppercase tracking-widest text-[var(--accent)] font-semibold mb-2">
            REAL-TIME MARKETS
          </p>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">行情数据</h1>
          <p className="text-sm text-[var(--foreground-muted)]">
            东北亚镁质交易所 · 实时数据 · 共 {mockMarketData.length} 个合约
          </p>
        </div>
      </header>

      <section className="px-10 py-10">
        <h2 className="text-xs uppercase tracking-widest text-[var(--foreground-dim)] font-semibold mb-4">
          · Active Contracts ·
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {mockMarketData.map((data) => (
            <MarketCard key={data.symbol} data={data} />
          ))}
        </div>

        <h2 className="text-xs uppercase tracking-widest text-[var(--foreground-dim)] font-semibold mb-4">
          · Detailed Quote Table ·
        </h2>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--surface-elevated)]/50 border-b border-[var(--border)]">
                <tr>
                  <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-[var(--foreground-dim)] uppercase tracking-widest">
                    Symbol
                  </th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-[var(--foreground-dim)] uppercase tracking-widest">
                    品种
                  </th>
                  <th className="text-right px-5 py-3.5 text-[10px] font-semibold text-[var(--foreground-dim)] uppercase tracking-widest">
                    Last
                  </th>
                  <th className="text-right px-5 py-3.5 text-[10px] font-semibold text-[var(--foreground-dim)] uppercase tracking-widest">
                    Change
                  </th>
                  <th className="text-right px-5 py-3.5 text-[10px] font-semibold text-[var(--foreground-dim)] uppercase tracking-widest">
                    Change %
                  </th>
                  <th className="text-right px-5 py-3.5 text-[10px] font-semibold text-[var(--foreground-dim)] uppercase tracking-widest">
                    Volume
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {mockMarketData.map((d) => {
                  const isUp = d.changeCents >= 0;
                  const color = isUp ? "text-[var(--success)]" : "text-[var(--danger)]";
                  return (
                    <tr key={d.symbol} className="hover:bg-[var(--surface-elevated)]/30 transition-colors">
                      <td className="px-5 py-4 text-[var(--accent)] font-mono text-xs font-semibold">
                        {d.symbol}
                      </td>
                      <td className="px-5 py-4 text-white text-sm">{d.name}</td>
                      <td className={`px-5 py-4 text-right font-mono font-semibold ${color}`}>
                        {formatPrice(d.priceCents)}
                      </td>
                      <td className={`px-5 py-4 text-right font-mono text-xs ${color}`}>
                        {isUp ? "+" : ""}
                        {formatPrice(d.changeCents)}
                      </td>
                      <td className={`px-5 py-4 text-right ${color}`}>
                        <span className="inline-flex items-center gap-1 font-mono text-xs">
                          <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="currentColor">
                            {isUp ? <path d="M6 2l5 6H1z" /> : <path d="M6 10L1 4h10z" />}
                          </svg>
                          {isUp ? "+" : ""}
                          {d.changePercent}%
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-[var(--foreground-muted)] font-mono text-xs">
                        {formatVolume(d.volume)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
