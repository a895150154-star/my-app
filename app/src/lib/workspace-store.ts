/**
 * FIN AI · Workspace localStorage 持久化
 *
 * MVP 方案：所有 dashboard 状态存浏览器 localStorage
 * - 不依赖后端
 * - 不需要登录系统
 * - 关掉浏览器还在；换设备/清缓存就没了
 *
 * 升级路径：未来要做真用户系统时，把读写函数指向 Supabase 即可
 */

export type WidgetKind =
  | "kline"
  | "fundamental"
  | "research"
  | "quote_card"
  | "valuation"
  | "holders";

export interface Tab {
  id: string;
  title: string;
  widget: WidgetKind;
  symbol: string;
  /** Grid 平铺时占多少列（1-4，默认按 widget kind 自动） */
  span?: 1 | 2 | 3 | 4;
  /** Grid 平铺时占多少行（1-2，默认 1） */
  rowSpan?: 1 | 2;
}

export interface Dashboard {
  id: string;
  name: string;
  tabs: Tab[];
  /** 默认激活的 tab id */
  activeTabId?: string;
  /** 创建时间，毫秒时间戳 */
  createdAt: number;
}

export interface WorkspaceState {
  /** 用户所有 dashboard */
  dashboards: Dashboard[];
  /** 当前选中的 dashboard id */
  currentDashboardId: string | null;
  /** 当前选中的 AI 角色 id */
  agentId: string;
}

const STORAGE_KEY = "finai.workspace.v2";

/**
 * 默认初始状态 —— 首次进入时填充
 */
export function getDefaultState(): WorkspaceState {
  const overviewTabsFor = (symbol: string, name: string): Tab[] => [
    { id: `${symbol}-quote`, title: `${name} · 实时行情`, widget: "quote_card", symbol },
    { id: `${symbol}-val`, title: `${name} · 估值与市值`, widget: "valuation", symbol },
    { id: `${symbol}-hld`, title: `${name} · 股东结构`, widget: "holders", symbol },
    { id: `${symbol}-kline`, title: `${name} · K 线`, widget: "kline", symbol },
    { id: `${symbol}-research`, title: `${name} · 研判`, widget: "research", symbol },
    { id: `${symbol}-fundamental`, title: `${name} · 财报`, widget: "fundamental", symbol },
  ];

  const defaultDashboard: Dashboard = {
    id: "dash-default",
    name: "茅台研究台",
    tabs: overviewTabsFor("600519", "茅台"),
    activeTabId: "600519-quote",
    createdAt: Date.now(),
  };

  return {
    dashboards: [
      {
        id: "dash-catl",
        name: "宁德研究台",
        tabs: overviewTabsFor("300750", "宁德时代"),
        activeTabId: "300750-quote",
        createdAt: Date.now() - 86400000,
      },
      defaultDashboard,
      {
        id: "dash-byd",
        name: "比亚迪研究台",
        tabs: overviewTabsFor("002594", "比亚迪"),
        activeTabId: "002594-quote",
        createdAt: Date.now() - 3600000,
      },
    ],
    currentDashboardId: "dash-default",
    agentId: "assistant",
  };
}

/**
 * 从 localStorage 读取
 */
export function loadState(): WorkspaceState {
  if (typeof window === "undefined") return getDefaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    const parsed = JSON.parse(raw) as WorkspaceState;
    // 简单 schema 校验
    if (!parsed.dashboards || !Array.isArray(parsed.dashboards)) {
      return getDefaultState();
    }
    return parsed;
  } catch {
    return getDefaultState();
  }
}

/**
 * 写入 localStorage
 */
export function saveState(state: WorkspaceState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("[workspace-store] 保存失败：", e);
  }
}

/**
 * 全清空（重置 demo）
 */
export function resetState(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

/**
 * 工具：生成 ID
 */
export function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
