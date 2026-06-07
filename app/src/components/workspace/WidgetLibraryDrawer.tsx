"use client";

import {
  LineChart,
  FileText,
  PencilLine,
  type LucideIcon,
  Activity,
  Globe,
  Building2,
  Calendar,
  Users,
  Wallet,
} from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import type { Tab, WidgetKind } from "@/lib/workspace-store";
import { newId } from "@/lib/workspace-store";

interface WidgetSpec {
  /** 真实可用的 kind */
  kind?: WidgetKind;
  label: string;
  icon: LucideIcon;
  desc: string;
  /** 是否已实现，false 显示 Coming Soon */
  available: boolean;
  group: "已实现" | "即将上线";
}

const WIDGET_CATALOG: WidgetSpec[] = [
  // 已实现 6 个
  { kind: "quote_card", label: "实时行情卡", icon: Activity, desc: "现价 / 涨跌 / 量比 / 换手率 / 振幅", available: true, group: "已实现" },
  { kind: "valuation", label: "估值与市值", icon: Wallet, desc: "PE / PB / PS / 总市值 / 股息率", available: true, group: "已实现" },
  { kind: "kline", label: "K 线 + 技术指标", icon: LineChart, desc: "日 K + MACD/KDJ/布林带", available: true, group: "已实现" },
  { kind: "fundamental", label: "财报快照", icon: FileText, desc: "营收 / 净利 / 毛利率 / ROE", available: true, group: "已实现" },
  { kind: "holders", label: "前 10 大流通股东", icon: Users, desc: "机构持股比例 + 增减持变动", available: true, group: "已实现" },
  { kind: "research", label: "分析师研判", icon: PencilLine, desc: "本地研判库 · AI 引用并转述", available: true, group: "已实现" },

  // Coming soon
  { label: "资金流向", icon: Activity, desc: "主力 / 散户 / 北向 流入流出（需 Tushare 2000+ 积分）", available: false, group: "即将上线" },
  { label: "宏观指标", icon: Globe, desc: "CPI / PMI / 社融 / 利率", available: false, group: "即将上线" },
  { label: "公司公告", icon: Building2, desc: "实时公告流 · 重大事项标签", available: false, group: "即将上线" },
  { label: "财报日历", icon: Calendar, desc: "下周财报披露名单 + 预测", available: false, group: "即将上线" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  /** 新增一个 widget tab */
  onAdd: (tab: Tab) => void;
}

export default function WidgetLibraryDrawer({ open, onClose, onAdd }: Props) {
  const grouped = {
    已实现: WIDGET_CATALOG.filter((w) => w.available),
    即将上线: WIDGET_CATALOG.filter((w) => !w.available),
  };

  const handleAdd = (spec: WidgetSpec) => {
    if (!spec.available || !spec.kind) return;
    onAdd({
      id: newId("t"),
      title: spec.label,
      widget: spec.kind,
      symbol: "600519",
    });
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="小部件库"
      subtitle="12 个数据视图 · 自由组合工作台"
      width={520}
    >
      <div className="p-4 space-y-6">
        {(["已实现", "即将上线"] as const).map((group) => (
          <div key={group}>
            <p className="text-[var(--font-micro)] uppercase tracking-wider text-[var(--color-text-subtle)] font-mono mb-3 flex items-center gap-2">
              <span>{group}</span>
              <span className="num">·</span>
              <span className="num">{grouped[group].length}</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              {grouped[group].map((w) => {
                const Icon = w.icon;
                return (
                  <button
                    key={w.label}
                    onClick={() => handleAdd(w)}
                    disabled={!w.available}
                    className={`flex items-start gap-3 p-3 rounded-[var(--radius-md)] border text-left transition-all ${
                      w.available
                        ? "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-2)] cursor-pointer"
                        : "bg-[var(--color-surface)]/40 border-[var(--color-border)] opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 shrink-0 rounded-[var(--radius-sm)] ${
                        w.available
                          ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                          : "bg-[var(--color-surface-3)] text-[var(--color-text-subtle)]"
                      }`}
                    >
                      <Icon className="w-4 h-4" strokeWidth={1.75} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[var(--font-body-sm)] font-medium truncate">
                          {w.label}
                        </span>
                        {!w.available && (
                          <span className="text-[10px] px-1 py-0.5 rounded bg-[var(--color-surface-3)] text-[var(--color-text-subtle)] font-mono whitespace-nowrap">
                            敬请期待
                          </span>
                        )}
                      </div>
                      <p className="text-[var(--font-micro)] text-[var(--color-text-muted)] leading-relaxed">
                        {w.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Drawer>
  );
}
