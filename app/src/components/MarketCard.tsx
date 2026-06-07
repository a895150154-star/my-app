import { MarketData } from "@/types";
import { formatPrice, formatVolume } from "@/lib/mock-data";

interface MarketCardProps {
  data: MarketData;
}

export default function MarketCard({ data }: MarketCardProps) {
  const isUp = data.changeCents >= 0;
  const upColor = "text-[var(--success)]";
  const downColor = "text-[var(--danger)]";

  return (
    <div className="group relative bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 hover:border-[var(--border-strong)] transition-all overflow-hidden">
      <div
        className={`absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent ${
          isUp ? "via-[var(--success)]" : "via-[var(--danger)]"
        } to-transparent opacity-50`}
      />
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] text-[var(--foreground-dim)] uppercase tracking-widest mb-1">
            {data.symbol}
          </p>
          <p className="text-sm font-semibold text-white">{data.name}</p>
        </div>
        <div className={`flex items-center gap-1 ${isUp ? upColor : downColor}`}>
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
            {isUp ? (
              <path d="M6 2l5 6H1z" />
            ) : (
              <path d="M6 10L1 4h10z" />
            )}
          </svg>
          <span className="text-xs font-mono font-medium">
            {isUp ? "+" : ""}
            {data.changePercent}%
          </span>
        </div>
      </div>

      <div className="mb-4">
        <p className={`text-2xl font-bold font-mono tracking-tight ${isUp ? upColor : downColor}`}>
          {formatPrice(data.priceCents)}
        </p>
        <p className="text-[10px] text-[var(--foreground-dim)] mt-1">CNY / 吨</p>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--border)]">
        <div>
          <p className="text-[10px] text-[var(--foreground-dim)] uppercase tracking-wider mb-1">
            Change
          </p>
          <p className={`text-xs font-mono ${isUp ? upColor : downColor}`}>
            {isUp ? "+" : ""}
            {formatPrice(data.changeCents)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--foreground-dim)] uppercase tracking-wider mb-1">
            Volume
          </p>
          <p className="text-xs font-mono text-[var(--foreground-muted)]">
            {formatVolume(data.volume)}
          </p>
        </div>
      </div>
    </div>
  );
}
