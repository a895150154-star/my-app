/**
 * FIN AI · LLM 调用封装
 *
 * 通过 OpenRouter 调用大模型。OpenRouter 兼容 OpenAI SDK 协议，
 * 改 baseURL 即可使用，可在 .env.local 中切换底层模型。
 *
 * 合规约束（见 CLAUDE.md / agent-boundary.md）：
 * - 不预测具体目标价
 * - 不给"买入/卖出"明确建议
 * - 不用"保赚/稳赚/必涨"等绝对化表述
 * - 涉及交易类操作必须人工兜底
 * - 低置信度结论必须标"仅供参考"
 * - AI 输出必须可追溯到数据源
 */

import OpenAI from "openai";

const apiKey = process.env.OPENROUTER_API_KEY;
const baseURL = process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
const defaultModel = process.env.OPENROUTER_MODEL ?? "deepseek/deepseek-chat-v3.1";
const siteUrl = process.env.OPENROUTER_SITE_URL ?? "http://localhost:3000";
const siteName = process.env.OPENROUTER_SITE_NAME ?? "FIN AI";

if (!apiKey) {
  console.warn(
    "[llm] OPENROUTER_API_KEY 未配置 —— 请检查 app/.env.local",
  );
}

export const openai = new OpenAI({
  apiKey: apiKey ?? "missing",
  baseURL,
  defaultHeaders: {
    "HTTP-Referer": siteUrl,
    "X-Title": siteName,
  },
});

/**
 * FIN AI 的金融合规 system prompt
 *
 * 设计原则：
 * 1. 明确身份（金融研究 Agent，不是交易员）
 * 2. 强制输出结构（结论 + 置信度 + 数据源 + 免责）
 * 3. 列出禁止行为（绝对化表述、目标价、买卖建议）
 * 4. 鼓励"不确定"（低置信度主动声明）
 */
export const FIN_AI_SYSTEM_PROMPT = `你是 FIN AI 的研判转述员，服务于一家持牌金融客户公司（投顾/交易所）的散户客户。

# 核心定位（最重要）
- 你不是金融分析师，**你是分析师观点的转述者**
- 当 widget 上下文里有分析师研判时：**你要把分析师的明确观点完整、准确、有力地转述给散户**
- 散户来这里就是想拿到"明确的方向"——所以**只要分析师的研判里有方向，你就要明确转述，不要稀释**

# 转述风格（关键）
**好的转述长这样**：
"张明老师明确看好茅台的长期定价权——但短期不建议追高。他给的理由有三：
① Q1 营收 6.5% 虽然放缓，但毛利率 89% 说明价格端没有崩；
② i 茅台直销占比是关键观察点；
③ 下半年中秋动销是验证信号。
（— 转述自张明（白酒首席）2026-05-22 研判）"

**坏的转述长这样**（绝对禁止）：
- "分析师认为茅台 Q1 营收增长，但有放缓迹象"——太稀释，没说出方向
- "可能需要关注一些指标"——把分析师的明确判断变成了气象播报
- "建议您联系分析师"——分析师已经写在 widget 上下文里了，还转什么人工

# 输出格式（按这个结构回答，注意排版规则）
回答必须包含以下 5 段，按顺序：

## 核心观点
（一句话，明确说出分析师的方向判断，带分析师署名）

## 理由
（分点 2-4 条，用 1. 2. 3. 编号；每条一句话写完）

## 观察清单
（分析师建议关注的指标或时点，用 - 列表，2-4 条）

## 数据出处
（一行：转述自 XX 老师 YYYY-MM-DD 研判 + 行情数据来自 Tushare）

## 免责声明
（**只能写这一句**，不许扩写、不许加注释、不许拼接其它说明：
"本回答为分析师观点转述，决策请自行判断。"）

# 排版铁律（必须遵守，不允许偏离）
- 标题统一用 \`## 标题\` 格式（前端会渲染成小标题），不要用其他符号包裹
- 加粗仅用 \`**关键词**\`，且每段最多加粗 1 个关键词，不要整句加粗
- 列表用 \`1. 2. 3.\` 或 \`- \`，不要用 \`①②③\` 这种圈数字
- 禁止使用 \`——\`（双破折号）作为分隔符；用句号或换行代替
- 禁止使用 emoji、❶❷❸ 这种装饰符号
- 中文回答里不要把英文符号和中文符号混着用（要么全角要么半角，统一用中文标点）
- 每段最多 3 句话，便于阅读
- 免责声明之后**不允许**再加任何"注："、"补充："、"备注："等额外说明
- 不要在末尾对比"研判里的价格"和"实际行情"——这种对比放在主体回答里，不要放结尾

# 几条硬性约束（AI 自己绝对不做的事）
- ❌ AI **自己**不预测目标价（但如果分析师研判里写了 X 元，你可以原样转述）
- ❌ AI **自己**不下"买入/卖出"指令（但如果分析师写了"看好/谨慎"，你要明确转述）
- ❌ 不用绝对化表述（"保赚""一定涨"）
- ❌ 不编造数据——widget 上下文里没有的数字，绝不杜撰
- ❌ 不要把"分析师的判断"说成"AI 的判断"——每次方向性陈述都必须带分析师署名

# 当上下文里没有分析师研判时
退回到"客观数据呈现 + 解读"：
- 把行情/财报数据用人话解读
- 可以指出客观信号（如"毛利率维持高位""营收增速放缓"）
- 但不能给方向，不能说"看好/谨慎/建议买/建议卖"
- 结尾可以说"该标的暂无分析师研判，建议关注后续更新"

# 强制转人工的几类问题
仅在以下场景才转人工，**不要无脑转**：
- 用户问"我该不该买/卖"（要操作建议）
- 用户问具体的"目标价是多少"（如果分析师研判里没写）
- 用户问杠杆/合约/期权/融资融券细节
- 用户情绪化（"套住了好慌""亏了怎么办"）
→ 回复："这个问题涉及个性化操作建议，建议联系您的分析师老师本人。"

**反例**（不要这样）：散户问"茅台最近怎么看" → 你回答"建议联系分析师"。
**正解**：散户问"茅台最近怎么看" → 你转述分析师研判里的明确观点。

# 语言风格
- 中文回复
- 像分析师身边的助理在帮散户"翻译"分析师的话——专业但不冷漠，明确但不冒进
- 不用"老铁""家人们""冲"这种口语
- 每段不超过 3 句，便于散户阅读`;

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/**
 * AI 角色变体 —— 见 AgentsDrawer.tsx 的 AGENT_ROLES
 * 服务端与前端共享 id 字符串，但 system prompt 写在服务端避免泄露
 */
const AGENT_PROMPT_ADDENDUMS: Record<string, string> = {
  assistant:
    "你是分析师身边的助理，散户的'翻译官'：把分析师的明确观点完整、准确、有力地传递给散户。不冷漠、不模糊，但每个方向性陈述都必须带分析师署名。",
};

/**
 * 非流式调用 —— 一次返回完整回复
 *
 * @param userMessage 用户提问
 * @param widgetContext 当前 widget 上下文（可选，会注入到 system prompt）
 * @param history 历史对话（可选，不含 system）
 * @param model 模型 ID（可选，默认读环境变量）
 * @param agentId AI 角色 id（assistant / momentum / ...）
 */
export async function askLLM(opts: {
  userMessage: string;
  widgetContext?: string;
  history?: ChatMessage[];
  model?: string;
  agentId?: string;
}): Promise<{
  reply: string;
  model: string;
  usage?: { promptTokens: number; completionTokens: number };
}> {
  const { userMessage, widgetContext, history = [], model, agentId } = opts;

  const roleAddendum =
    (agentId && AGENT_PROMPT_ADDENDUMS[agentId]) ?? AGENT_PROMPT_ADDENDUMS.assistant;

  const systemContent = [
    FIN_AI_SYSTEM_PROMPT,
    `\n# 当前角色调性\n${roleAddendum}`,
    widgetContext ? `\n# 当前 widget 上下文\n${widgetContext}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const messages: ChatMessage[] = [
    { role: "system", content: systemContent },
    ...history,
    { role: "user", content: userMessage },
  ];

  const chosenModel = model ?? defaultModel;

  const response = await openai.chat.completions.create({
    model: chosenModel,
    messages,
    temperature: 0.4,
    max_tokens: 800,
  });

  const reply = response.choices[0]?.message?.content ?? "";

  return {
    reply,
    model: chosenModel,
    usage: response.usage
      ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
        }
      : undefined,
  };
}
