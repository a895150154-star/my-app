# FIN AI — 设计规范 (DESIGN.md)

> 最后更新：2026-05-23
> 上游来源：项目 CLAUDE.md（产品定位） + Coinbase / Stripe 设计系统（视觉参考）
> 交互档位：**L2 流畅交互**
> 证据等级：🟢 充分（产品定位明确 + 参考体系成熟 + token 经过金融合规适配）
> 适用范围：**当前阶段 Landing + Demo 页；token 已预留应用内 UI 扩展（表单/数据表/状态徽章/Modal）**

---

## 1. Visual Theme & Atmosphere

**一句话定调**：把彭博终端的专业冷静感，翻译成 AI Agent 时代的克制现代语言。

**氛围关键词**：克制 · 专业 · 数据驱动 · 暗色优先 · 可信赖

**设计哲学**：
FIN AI 面向散户提供金融研究 Agent 能力。设计的核心命题是**用视觉传递可信度** —— 散户在金融场景里最怕"被割"，任何过度炫技的视觉都会损害可信感。我们参考 Coinbase 的金融克制 + Stripe 的精密排版，把强调色控制在**单一品牌色**（信任青蓝），把动效控制在**滚动 reveal + 数据态过渡**这种"专业感动效"，让数据本身成为页面主角。

**目标用户视角**：
- 散户（25-45 岁）：信任感优先，看懂能赚钱、看清不亏钱
- 决策状态：拿不准、需要"分析师视角"代劳，但又怕被骗
- 设计要做的：让他们在第一屏就感受到"这家做的是认真产品"，而不是"又一个 AI 玩具"

**目标地区/语言**：中国大陆 / 中文为主（中英混排，Noto Sans SC + Inter）

**视觉气质 vs 反面**：
- ✅ 像彭博、Stripe、Coinbase 那种"我是金融基础设施"的笃定感
- ❌ 不要 Web3 那种发光霓虹、不要 AI demo 那种粒子流满天飞、不要传统券商那种红绿涨跌色填满屏幕

---

## 2. Color Palette & Roles

设计 token 全部走 CSS 变量，**零硬编码**。RGB 辅助值用于 rgba 透明组合。

```css
:root {
  /* ============ 主背景层（暗色优先）============ */
  --color-bg:            #0A0E1A;  /* rgb: 10, 14, 26    | 主页面背景，深蓝近黑、不刺眼 */
  --color-surface:       #131829;  /* rgb: 19, 24, 41    | 卡片/区块背景，比 bg 略亮 */
  --color-surface-2:     #1B2236;  /* rgb: 27, 34, 54    | 嵌套卡片、Hover 态 */
  --color-surface-3:     #232B42;  /* rgb: 35, 43, 66    | 表单输入、Modal、Drawer */

  /* ============ 文字层 ============ */
  --color-text:          #F5F7FA;  /* rgb: 245, 247, 250 | 主文字，纯白偏冷 */
  --color-text-muted:    #A8B2C8;  /* rgb: 168, 178, 200 | 次要文字、描述 */
  --color-text-subtle:   #6B7691;  /* rgb: 107, 118, 145 | 元信息、时间戳、注释 */
  --color-text-on-accent:#FFFFFF;  /* rgb: 255, 255, 255 | 强调色背景上的文字 */

  /* ============ 边框与分隔 ============ */
  --color-border:        #2A334D;  /* rgb: 42, 51, 77    | 标准边框 */
  --color-border-strong: #3A4566;  /* rgb: 58, 69, 102   | 强调边框、Focus 外圈 */
  --color-divider:       rgba(255, 255, 255, 0.06);

  /* ============ 品牌强调色（青蓝，信任感）============ */
  --color-accent:        #2E7FFF;  /* rgb: 46, 127, 255  | 主品牌色，CTA、链接、Focus */
  --color-accent-hover:  #4A92FF;  /* rgb: 74, 146, 255  | Hover 态 */
  --color-accent-active: #1F6AE0;  /* rgb: 31, 106, 224  | Active/按下态 */
  --color-accent-soft:   rgba(46, 127, 255, 0.12); /* 透明品牌背景 */

  /* ============ 语义色（金融场景定制）============ */
  /* 注意：中国市场涨跌色与西方相反，这里默认按中国习惯，红涨绿跌 */
  /* 但金融研究 Agent 是分析输出，不显示行情盘面，所以涨跌色仅在「演示行情卡片」时使用 */
  --color-up:            #E84B5F;  /* rgb: 232, 75, 95   | 涨/红，中国习惯 */
  --color-down:          #1FCB7E;  /* rgb: 31, 203, 126  | 跌/绿，中国习惯 */
  --color-up-soft:       rgba(232, 75, 95, 0.12);
  --color-down-soft:     rgba(31, 203, 126, 0.12);

  /* ============ 状态色 ============ */
  --color-success:       #1FCB7E;  /* 同 --color-down，跌色和成功色都用绿，符合中国直觉 */
  --color-warning:       #F5A623;  /* rgb: 245, 166, 35  | 警告、低置信度标识 */
  --color-warning-soft:  rgba(245, 166, 35, 0.14);
  --color-danger:        #E84B5F;  /* 同 --color-up */
  --color-info:          #2E7FFF;  /* 同 --color-accent */

  /* ============ 置信度专属色（金融 Agent 特色）============ */
  --color-confidence-high:   #1FCB7E;  /* 高置信度，绿 */
  --color-confidence-mid:    #F5A623;  /* 中置信度，橙 */
  --color-confidence-low:    #6B7691;  /* 低置信度，灰（标"仅供参考"）*/

  /* ============ 阴影（Stripe 式蓝调多层）============ */
  --shadow-ambient:  0 3px 6px rgba(5, 10, 30, 0.18);
  --shadow-standard: 0 15px 35px rgba(5, 10, 30, 0.28);
  --shadow-elevated: 0 30px 45px -30px rgba(46, 127, 255, 0.25),
                     0 18px 36px -18px rgba(0, 0, 0, 0.4);
  --shadow-deep:     0 14px 21px -14px rgba(46, 127, 255, 0.32),
                     0 8px 17px -8px rgba(0, 0, 0, 0.5);
  --shadow-focus:    0 0 0 3px rgba(46, 127, 255, 0.35);

  /* ============ 渐变 ============ */
  --gradient-brand:    linear-gradient(135deg, #2E7FFF 0%, #6B5AFF 100%);
  --gradient-hero-bg:  radial-gradient(ellipse at top, rgba(46, 127, 255, 0.18) 0%, transparent 60%);
  --gradient-data:     linear-gradient(180deg, rgba(46, 127, 255, 0.08) 0%, transparent 100%);

  /* ============ 圆角（Stripe 式克制）============ */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-pill: 999px;

  /* ============ 字号变量（详见第 3 节）============ */
  --font-display: 56px;
  --font-h1:      40px;
  --font-h2:      32px;
  --font-h3:      24px;
  --font-h4:      20px;
  --font-body-lg: 18px;
  --font-body:    16px;
  --font-body-sm: 14px;
  --font-caption: 13px;
  --font-micro:   12px;

  /* ============ 间距梯度（4 的倍数）============ */
  --space-1:   4px;
  --space-2:   8px;
  --space-3:   12px;
  --space-4:   16px;
  --space-5:   20px;
  --space-6:   24px;
  --space-8:   32px;
  --space-10:  40px;
  --space-12:  48px;
  --space-16:  64px;
  --space-20:  80px;
  --space-24:  96px;
  --space-32:  128px;
}
```

**色彩使用规则**：

| 角色 | 推荐用法 |
|------|---------|
| `--color-accent` | 唯一品牌强调色，**单页出现 ≤ 5 处**，专留给 CTA、链接、Focus、关键数据高亮 |
| `--color-accent` | ❌ 禁止用于装饰性元素（卡片背景、分割线） |
| 涨跌色 | 仅在演示行情卡片、Demo 页推理依据中使用，不当装饰色 |
| 置信度色 | Agent 输出结论必须搭配置信度色块，让用户一眼看到「这条结论靠不靠谱」 |

---

## 3. Typography Rules

### 字体引入

```html
<!-- 在 app/src/app/layout.tsx 的 <head> 引入 -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+SC:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### Font Stack

```css
:root {
  /* 中英混排，中文字体在前作为主体，Inter 作为英文/数字 fallback */
  --font-sans: 'Inter', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;

  /* 标题专用：英文用 Inter Light/Medium，中文用 Noto Sans SC Medium */
  --font-display: 'Inter', 'Noto Sans SC', -apple-system, sans-serif;

  /* 代码、数据表格：等宽 + tabular-nums */
  --font-mono: 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace;
}

/* 中文场景必备：数字用 tabular，避免对齐错位 */
.num, .data-cell, .price {
  font-feature-settings: "tnum", "ss01";
  font-variant-numeric: tabular-nums;
}
```

### 字号层级表

| 用途 | 字号 (Desktop) | 字号 (Mobile) | 行高 | 字重 | 字距 | 备注 |
|------|----------------|---------------|------|------|------|------|
| Display Hero | 56px | 36px | 1.10 | 500 | -0.02em | 首屏 Hero 大标题 |
| H1 / Section | 40px | 28px | 1.15 | 500 | -0.02em | 章节标题 |
| H2 / Sub-section | 32px | 24px | 1.20 | 500 | -0.015em | 子区块 |
| H3 / Card Title | 24px | 20px | 1.30 | 500 | -0.01em | 卡片标题 |
| H4 / Feature | 20px | 18px | 1.35 | 600 | normal | 功能项标题 |
| Body Large | 18px | 16px | 1.65 | 400 | normal | Hero 副标题、引言段 |
| Body | 16px | 15px | 1.70 | 400 | normal | 正文 |
| Body Small | 14px | 14px | 1.60 | 400 | normal | 次要正文 |
| Caption | 13px | 13px | 1.50 | 500 | normal | 标签、徽章、元信息 |
| Micro | 12px | 12px | 1.40 | 500 | 0.02em | 最小标签、时间戳 |
| Mono Code | 14px | 13px | 1.60 | 400 | normal | 代码、数据表数字 |

### 排版纪律（中文必须遵守）

1. **行高 ≥ 1.65**：中文笔画密度高，行高紧了非常难读
2. **正文字号 ≥ 15px**：移动端 ≥ 14px，长文阅读 ≥ 16px
3. **字距**：中文正文 `letter-spacing: 0.02em`，标题可以 `-0.02em` 紧致
4. **中英混排**：靠 `font-family` 链接入，中文走 Noto Sans SC，数字/英文自动落到 Inter
5. **数字必用 `tnum`**：所有金融数据（价格、涨跌幅、置信度百分比）启用 tabular-nums

### 文字装饰规则

| 元素 | 是否加渐变/投影 | 说明 |
|------|----------------|------|
| Display Hero（首屏 H1） | ✅ 关键短语可加 `--gradient-brand` 渐变 | 一页**最多 1 处** |
| 普通 H1/H2 | ❌ 不加 | 纯色，专业感优先 |
| 数据数字（如"+15.2%"） | ❌ 不加渐变 | 用 `--color-up` / `--color-down` 即可 |
| 正文 | ❌ 永远不加 | |

---

## 4. Component Stylings（核心组件，全状态）

### 4.1 Buttons

```css
/* ============ Primary Button（主要 CTA）============ */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: 12px 24px;
  font-family: var(--font-sans);
  font-size: var(--font-body);
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0.01em;
  color: var(--color-text-on-accent);
  background: var(--color-accent);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 200ms ease-out;
  user-select: none;
}
.btn-primary:hover {
  background: var(--color-accent-hover);
  border-color: var(--color-accent-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-elevated);
}
.btn-primary:active {
  background: var(--color-accent-active);
  transform: translateY(0);
  box-shadow: var(--shadow-ambient);
}
.btn-primary:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
}
.btn-primary:disabled {
  background: var(--color-surface-3);
  border-color: var(--color-border);
  color: var(--color-text-subtle);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* ============ Secondary Button（次要操作，描边款）============ */
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: 12px 24px;
  font-family: var(--font-sans);
  font-size: var(--font-body);
  font-weight: 500;
  line-height: 1;
  color: var(--color-text);
  background: transparent;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 200ms ease-out;
}
.btn-secondary:hover {
  background: var(--color-surface-2);
  border-color: var(--color-accent);
  color: var(--color-accent);
}
.btn-secondary:active {
  background: var(--color-surface-3);
}
.btn-secondary:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
}
.btn-secondary:disabled {
  color: var(--color-text-subtle);
  border-color: var(--color-border);
  cursor: not-allowed;
}

/* ============ Ghost Button（导航栏、轻量操作）============ */
.btn-ghost {
  padding: 8px 16px;
  font-size: var(--font-body-sm);
  font-weight: 500;
  color: var(--color-text-muted);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: color 160ms ease-out;
}
.btn-ghost:hover { color: var(--color-text); }
.btn-ghost:active { color: var(--color-accent); }
.btn-ghost:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
}
```

### 4.2 Cards

```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  transition: all 240ms cubic-bezier(0.4, 0, 0.2, 1);
}
.card:hover {
  border-color: var(--color-border-strong);
  background: var(--color-surface-2);
  transform: translateY(-2px);
  box-shadow: var(--shadow-elevated);
}

/* 高亮卡片（用于推理依据、关键结论） */
.card-featured {
  background: var(--color-surface);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-elevated);
  position: relative;
  overflow: hidden;
}
.card-featured::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: var(--gradient-brand);
}
```

### 4.3 Inputs

```css
.input {
  width: 100%;
  padding: 12px 16px;
  font-family: var(--font-sans);
  font-size: var(--font-body);
  line-height: 1.5;
  color: var(--color-text);
  background: var(--color-surface-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: all 180ms ease-out;
}
.input::placeholder {
  color: var(--color-text-subtle);
}
.input:hover {
  border-color: var(--color-border-strong);
}
.input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: var(--shadow-focus);
  background: var(--color-surface-2);
}
.input:disabled {
  background: var(--color-surface);
  color: var(--color-text-subtle);
  cursor: not-allowed;
}
.input[aria-invalid="true"] {
  border-color: var(--color-danger);
}
.input[aria-invalid="true"]:focus {
  box-shadow: 0 0 0 3px rgba(232, 75, 95, 0.3);
}
```

### 4.4 Navigation Bar

```css
.navbar {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-8);
  background: rgba(10, 14, 26, 0.72);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--color-divider);
  transition: all 240ms ease-out;
}
/* 滚动后状态（JS 加 .scrolled 类） */
.navbar.scrolled {
  background: rgba(10, 14, 26, 0.92);
  border-bottom-color: var(--color-border);
  box-shadow: var(--shadow-ambient);
}
.navbar-link {
  font-size: var(--font-body-sm);
  font-weight: 500;
  color: var(--color-text-muted);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  transition: all 160ms ease-out;
  position: relative;
}
.navbar-link:hover {
  color: var(--color-text);
}
.navbar-link.active {
  color: var(--color-accent);
}
.navbar-link.active::after {
  content: '';
  position: absolute;
  left: var(--space-3);
  right: var(--space-3);
  bottom: 2px;
  height: 2px;
  background: var(--color-accent);
  border-radius: 999px;
}
.navbar-link:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
}
```

### 4.5 Badges / Tags（金融场景常用）

```css
/* 置信度徽章 */
.badge-confidence {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  font-size: var(--font-micro);
  font-weight: 500;
  border-radius: var(--radius-pill);
  letter-spacing: 0.02em;
}
.badge-confidence--high {
  color: var(--color-confidence-high);
  background: rgba(31, 203, 126, 0.12);
  border: 1px solid rgba(31, 203, 126, 0.3);
}
.badge-confidence--mid {
  color: var(--color-confidence-mid);
  background: rgba(245, 166, 35, 0.12);
  border: 1px solid rgba(245, 166, 35, 0.3);
}
.badge-confidence--low {
  color: var(--color-confidence-low);
  background: rgba(107, 118, 145, 0.16);
  border: 1px solid rgba(107, 118, 145, 0.3);
}
.badge-confidence::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

/* 数据源徽章 */
.badge-source {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  font-size: var(--font-micro);
  font-weight: 500;
  color: var(--color-text-muted);
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xs);
  font-family: var(--font-mono);
}
```

### 4.6 Links

```css
.link {
  color: var(--color-accent);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 160ms ease-out, color 160ms ease-out;
}
.link:hover {
  color: var(--color-accent-hover);
  border-bottom-color: var(--color-accent-hover);
}
.link:focus-visible {
  outline: none;
  border-bottom-color: var(--color-accent);
  box-shadow: 0 2px 0 var(--color-accent);
}
```

---

## 5. Layout Principles

### 断点

| 名称 | 宽度范围 | 关键变化 |
|------|---------|---------|
| Mobile | ≤ 640px | 单列，导航折叠为汉堡菜单，Hero 36px |
| Tablet | 641 – 1024px | 2 列网格，Hero 44px |
| Desktop | 1025 – 1440px | 主版式，Hero 56px |
| Large | ≥ 1441px | 内容居中，最大宽度 1280px |

### 容器

```css
.container {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--space-6);  /* 24px on mobile */
}
@media (min-width: 1025px) {
  .container { padding: 0 var(--space-10); }  /* 40px on desktop */
}
```

### 章节间距

| 类型 | Desktop | Mobile |
|------|---------|--------|
| Section 之间 | 96px | 64px |
| 卡片之间 | 24px | 16px |
| 段落之间 | 16px | 12px |

### 栅格

- Hero / 单列：`max-width: 880px` 居中
- 功能卡片：3 列 → 2 列 (Tablet) → 1 列 (Mobile)，`gap: 24px`
- Demo 推理过程：左右分栏，左 30% 输入 + 右 70% 推理流（Mobile 改为上下堆叠）

---

## 6. Depth & Elevation

| 层级 | 用法 | shadow |
|------|------|--------|
| Flat | 页面背景、内联元素 | none |
| Ambient | 标准卡片、Hover 提示 | `--shadow-ambient` |
| Standard | 卡片悬浮、下拉菜单 | `--shadow-standard` |
| Elevated | 重要卡片、推理结论卡 | `--shadow-elevated`（带品牌色蓝调） |
| Deep | Modal、Drawer | `--shadow-deep` |
| Focus | 键盘 Focus 环 | `--shadow-focus` |

**阴影哲学**：暗色背景下，传统黑色阴影几乎不可见。采用 Stripe 的**品牌色蓝调阴影**方案 —— 阴影本身带上 `rgba(46, 127, 255, 0.25)` 的青蓝色调，既能营造深度，又强化品牌氛围。

---

## 7. Animation & Interaction（L2 档位）

### 动效原则

1. **服务于"看清数据"，不为炫技** —— 任何动效不能阻碍用户阅读关键信息
2. **超过 600ms 的动效必须有 `prefers-reduced-motion` 降级**
3. **金融数据数字必须用 tween 滚动**（如 `+15.2%`），不能跳变 —— 给用户"数据在变化"的感知
4. **单页最多 2 处 signature moment**，不要堆动效

### 缓动曲线

```css
:root {
  --ease-out:        cubic-bezier(0.16, 1, 0.3, 1);    /* 入场，柔和 */
  --ease-in-out:     cubic-bezier(0.4, 0, 0.2, 1);     /* 过渡 */
  --ease-spring:     cubic-bezier(0.34, 1.56, 0.64, 1); /* 反馈，带回弹 */
  --duration-fast:   160ms;  /* Hover 微反馈 */
  --duration-base:   240ms;  /* 标准过渡 */
  --duration-slow:   480ms;  /* 入场动画 */
  --duration-reveal: 700ms;  /* 滚动 reveal */
}
```

### Hover / Focus 反馈（L1 基础）

- 按钮：`transform: translateY(-1px)` + 阴影加深，200ms
- 卡片：`border-color` 加深 + `translateY(-2px)`，240ms
- 链接：下划线展开，160ms

### 入场动画

```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-in {
  animation: fadeInUp var(--duration-reveal) var(--ease-out) both;
}

/* 错开依次入场 */
.animate-in[data-delay="1"] { animation-delay: 80ms; }
.animate-in[data-delay="2"] { animation-delay: 160ms; }
.animate-in[data-delay="3"] { animation-delay: 240ms; }
```

### 滚动 Reveal（L2 核心）

用 IntersectionObserver 触发，**不依赖第三方动效库**，零成本：

```typescript
// app/src/lib/scroll-reveal.ts
export function initScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -80px 0px' }
  );
  document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));
}
```

```css
[data-reveal] {
  opacity: 0;
  transform: translateY(32px);
  transition: opacity 700ms var(--ease-out), transform 700ms var(--ease-out);
}
[data-reveal].revealed {
  opacity: 1;
  transform: translateY(0);
}
[data-reveal][data-reveal-delay="1"] { transition-delay: 100ms; }
[data-reveal][data-reveal-delay="2"] { transition-delay: 200ms; }
[data-reveal][data-reveal-delay="3"] { transition-delay: 300ms; }
```

### 导航栏滚动变化

```typescript
// 滚动 > 60px 给 navbar 加 .scrolled 类，激活更不透明背景
const onScroll = () => {
  const nav = document.querySelector('.navbar');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);
};
window.addEventListener('scroll', onScroll, { passive: true });
```

### Signature Moments（L2 必备 ≥ 3 处，已配齐 6 类）

| # | 类别 | 落点 | 实现 |
|---|------|------|------|
| 1 | **Hero H1 渐变扫光** | 首屏关键词"AI 分析师" | CSS `background-clip: text` + `background-position` keyframes |
| 2 | **数字滚动入场** | 信任背书的统计数字（"分析 10000+ 个标的"） | `requestAnimationFrame` tween，1200ms 过渡 |
| 3 | **置信度环形进度** | Demo 页 Agent 输出结论卡片 | SVG circle `stroke-dashoffset` 入场动画 |
| 4 | **卡片 hover 磁吸** | 功能卡片网格 | 鼠标位置驱动 `--mx/--my`，`radial-gradient` 跟踪光晕 |
| 5 | **推理步骤连线** | Demo 页"Agent 推理过程"区块 | SVG `path` 配合 `stroke-dashoffset` 逐步绘制 |
| 6 | **Hero 背景氛围** | 首屏背景 | `--gradient-hero-bg` 静态 radial，**不用 WebGL，保证性能** |

### 降级路径（不可省）

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  [data-reveal] {
    opacity: 1;
    transform: none;
  }
}
```

### 性能红线（必守）

- ❌ 禁止全屏 WebGL（金融场景没必要）
- ❌ `filter: blur()` 不用于运动元素（仅用于背景静态层）
- ❌ `backdrop-filter: blur()` 模糊值 ≤ 14px，且仅用于 navbar
- ❌ `pointermove` 监听必须 `requestAnimationFrame` 节流
- ❌ 不用 Lenis / scroll-jacking，原生滚动 `scroll-behavior: smooth` 足够

---

## 8. Do's and Don'ts

### ✅ Do（≥ 4 条）

1. **所有颜色走 CSS 变量**，未来要换主题或做白天版只改 `:root`
2. **数字必用 tabular-nums** —— 价格、涨跌幅、置信度对齐才像金融产品
3. **每个 Agent 输出结论必须搭配置信度徽章** —— 这是 CLAUDE.md 的硬约束
4. **暗色背景下用蓝调阴影**，不要用纯黑阴影（会"糊"成一团）
5. **中文行高 ≥ 1.65**，正文字号 ≥ 15px
6. **每个 section 之间留足呼吸**（Desktop 96px / Mobile 64px）
7. **数据源徽章常驻** —— 行情卡片、分析结论旁必须显示数据源 + 时间戳
8. **CTA 按钮单页 ≤ 2 个**，避免选择瘫痪
9. **关键金融数字保留 2 位小数 + 千分位**（如 `1,234.56`）

### ❌ Don't（≥ 5 条）

1. **不用红绿做装饰色** —— 红/绿只在涨跌、置信度语义场景出现，否则用品牌青蓝
2. **不给 Agent 输出加任何"推荐买入/卖出"动效** —— 违反合规，**legal red line**
3. **不用 Web3 风霓虹发光、粒子流、3D WebGL** —— 与"专业金融"调性冲突
4. **不在 Hero 用动态视频或多个 GIF** —— 拖累首屏 LCP，且金融用户讨厌
5. **不把数据"动画跳变"** —— 数字变化必须 tween，跳变让人觉得"假"
6. **不堆叠多种字体** —— Inter + Noto Sans SC + JetBrains Mono 共 3 个，不再加
7. **不用 emoji 表达专业概念** —— 用 [lucide-react](https://lucide.dev) 或内联 SVG
8. **不在金融数据旁放装饰性渐变/光斑** —— 视觉抢戏
9. **不用纯色块占位图** —— 用 Unsplash 或参考站 URL 占位
10. **不写出"保证/稳赚/必涨"等绝对化文案** —— 触犯合规红线

---

## 9. Responsive Behavior

### 断点速查

```css
/* Mobile First，默认样式即 mobile */
/* Tablet */ @media (min-width: 641px)  { ... }
/* Desktop */@media (min-width: 1025px) { ... }
/* Large */  @media (min-width: 1441px) { ... }
```

### 折叠策略

| 元素 | Mobile (≤640) | Tablet (641-1024) | Desktop (≥1025) |
|------|---------------|---------------------|---------------------|
| Navbar | 汉堡菜单 + Drawer | 折叠次要项 | 完整横向 |
| Hero | 36px 标题，单列 | 44px 标题 | 56px 标题 |
| 功能卡片 | 1 列 | 2 列 | 3 列 |
| Demo 推理 | 上下堆叠 | 上下堆叠 | 左右 30/70 |
| Section 间距 | 64px | 80px | 96px |
| 容器 padding | 24px | 32px | 40px |

### 触摸目标

- **所有可点击元素 ≥ 44×44px**
- 按钮 padding 不低于 `12px 24px`
- 导航链接 `padding: 12px 16px`（Mobile）

### 移动端硬约束

- ❌ 不允许横向滚动（除数据表格明确允许 `overflow-x: auto`）
- ✅ Hover 效果用 `@media (hover: hover)` 包起来，避免移动端粘连
- ✅ Focus ring 在 touch 设备上不显示（用 `:focus-visible`）

---

## 📎 实现交接（供下游 Claude Code 读取）

```yaml
design_status: ready
project: FIN AI · 金融分析智能体
theme: 克制 / 专业 / 数据驱动 / 暗色优先 / 可信赖
interaction_level: L2
color_system: 见 §2 CSS 变量，全部走 var(--color-...)
font_system:
  primary: Inter + Noto Sans SC
  mono: JetBrains Mono
  google_fonts_url: 见 §3
core_components:
  - btn-primary / btn-secondary / btn-ghost
  - card / card-featured
  - input
  - navbar
  - badge-confidence (high/mid/low)
  - badge-source
  - link
breakpoints:
  mobile: 0-640
  tablet: 641-1024
  desktop: 1025-1440
  large: 1441+
motion_libs: 不引入第三方动效库（IntersectionObserver + CSS 足够）
language_default: zh-CN（中英混排）
mvp_scope:
  current_phase:
    - Landing Page（首页）
    - Demo Page（演示 Agent 推理过程的内页）
  future_phase:
    - 登录 / 对话 / 报告 / 自选股 / 设置
    - token 已预留扩展空间
compliance_must_have:
  - Agent 输出结论必须搭配置信度徽章（high/mid/low）
  - 行情数据必须显示数据源 + 时间戳
  - 禁止"买入/卖出"具体建议
  - 禁止预测目标价
  - 低置信度结论必须标"仅供参考"
```

---

## 📎 给 Claude Code 的实现指令（Phase C 落地纪律）

### 实现纪律

1. **只实现 MVP 范围内的页面** —— 当前只做 Landing + Demo，**应用内页（登录/对话/报告）这阶段不写**
2. **零硬编码颜色** —— 全部 `var(--color-...)`
3. **按 Mobile-first 写样式**，再用 `min-width` 加桌面端
4. **每个可交互元素必须有 hover + focus + disabled 全状态**
5. **图片策略**：FIN AI 产品截图占位用 Unsplash 金融相关图（关键词 `finance dashboard / stock chart / trading`），实际产品图后续替换
6. **图标用 lucide-react**（已经是 Next.js 16 + React 19 兼容），单图标按需 `import { TrendingUp } from 'lucide-react'`
7. **Agent 输出区块强制带置信度徽章**，没有就不要画结论
8. **金融数字格式化**：用 `Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`
9. **每完成一个 section 停下来告诉用户** —— 不要一次性产 1000 行代码后才让用户审

### 反模式（看到自己在做就停下来）

- ❌ 在 Hero 加 3D 旋转地球 / 粒子流 / 视频背景 —— **违反 L2 档位 + 性能红线**
- ❌ 给 Demo 页输出"建议买入" —— **违反合规红线**
- ❌ 自作主张加用户登录页 —— **超出 MVP scope**
- ❌ 把涨跌色（红绿）当装饰色铺满页面 —— 必须保留语义色专属
- ❌ 为单个 icon 装整个 icon 包 —— 用 lucide-react 按需导入
- ❌ 用 `useEffect` 跑动效但没做 `prefers-reduced-motion` 降级

### 验证清单（写完 Phase C 必跑）

- [ ] 所有颜色都通过 CSS 变量
- [ ] 所有按钮 default / hover / active / focus / disabled 全状态可见
- [ ] Hero 在 Mobile / Tablet / Desktop 三档无溢出
- [ ] 数字用 tabular-nums（视觉对齐齐整）
- [ ] `prefers-reduced-motion: reduce` 下所有动效降级为 instant
- [ ] Lighthouse 移动端性能 ≥ 85，LCP ≤ 2.5s
- [ ] Demo 页 Agent 输出每条结论都有置信度徽章
- [ ] 浏览器 console 零 error / warning
- [ ] `npm run lint` + `npm run build` 全通过
