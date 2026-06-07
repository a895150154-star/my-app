/**
 * FIN AI · 事实校验（TF-IDF 降级方案）
 *
 * 目标：把 AI 输出的每个句子和知识库片段做相似度比对，
 *      低于阈值的句子自动打"仅供参考"标签。
 *
 * 为什么用 TF-IDF 而不是 embedding：
 * - 不需要额外 API 调用，零成本
 * - 中文金融术语的字符级 / bigram TF-IDF 已经能反映"事实重合度"
 * - 阈值是经验值，演示版够用；上线前可平滑升级到 embedding
 *
 * 阈值标定（演示版）：
 * - score ≥ 0.35 → high  （高置信，✓ 已校验）
 * - 0.18 ≤ score < 0.35 → mid（中置信，⚠ 综合解读）
 * - score < 0.18 → low（低置信，自动加"仅供参考"）
 *
 * 注意：阈值偏低是有意的——中文 bigram TF-IDF 在短文本下分数普遍不高，
 * 阈值偏高会造成大量误判。
 */

export type FactConfidence = "high" | "mid" | "low";

export interface SentenceFactCheck {
  sentence: string;
  /** 余弦相似度 0-1 */
  score: number;
  confidence: FactConfidence;
  /** 命中的知识库片段（前 1 个） */
  matchedSource?: string;
}

export interface FactCheckReport {
  /** 整体置信度（取所有句子的最差档） */
  overall: FactConfidence;
  /** 平均相似度 */
  avgScore: number;
  /** 每个句子的校验明细 */
  sentences: SentenceFactCheck[];
  /** 改写后的回答：低置信句子后面加 "（仅供参考）" 标记 */
  annotatedReply: string;
}

const HIGH_THRESHOLD = 0.25;
const MID_THRESHOLD = 0.12;

// ============================================================
// 中文友好的分句
// ============================================================

/**
 * 按中文标点切句；保留分隔符让 annotated reply 能拼回去
 * 返回 [sentence, separator] 元组数组
 */
function splitSentences(text: string): { sentence: string; sep: string }[] {
  const out: { sentence: string; sep: string }[] = [];
  // 不把数字之间的点当句号（如 9.1 / 1.5）
  const re = /([^。！？!?\n]+)([。！？!?\n]+|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const s = m[1].trim();
    if (s) out.push({ sentence: s, sep: m[2] ?? "" });
  }
  return out;
}

// ============================================================
// 中文 bigram tokenizer（字符级 + bigram，对中文金融术语友好）
// ============================================================

function tokenize(text: string): string[] {
  // 去掉 markdown 标记和标点（保留中英文数字）
  const clean = text
    .replace(/[*#`>\-_~|()（）【】[\]{}「」"'""'',，。！？!?:：;；\s]+/g, "")
    .toLowerCase();
  if (!clean) return [];
  const tokens: string[] = [];
  // 单字
  for (const ch of clean) tokens.push(ch);
  // bigram
  for (let i = 0; i < clean.length - 1; i++) {
    tokens.push(clean.slice(i, i + 2));
  }
  return tokens;
}

// ============================================================
// TF-IDF + 余弦相似度
// ============================================================

interface IDFIndex {
  idf: Map<string, number>;
  docCount: number;
}

function buildIDF(documents: string[]): IDFIndex {
  const docFreq = new Map<string, number>();
  for (const doc of documents) {
    const unique = new Set(tokenize(doc));
    for (const tok of unique) {
      docFreq.set(tok, (docFreq.get(tok) ?? 0) + 1);
    }
  }
  const idf = new Map<string, number>();
  const N = documents.length;
  for (const [tok, df] of docFreq) {
    // 平滑 IDF
    idf.set(tok, Math.log((N + 1) / (df + 1)) + 1);
  }
  return { idf, docCount: N };
}

function tfidfVector(text: string, idfIndex: IDFIndex): Map<string, number> {
  const tokens = tokenize(text);
  if (tokens.length === 0) return new Map();
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  const vec = new Map<string, number>();
  for (const [t, freq] of tf) {
    const idf = idfIndex.idf.get(t) ?? Math.log(idfIndex.docCount + 1) + 1;
    vec.set(t, (freq / tokens.length) * idf);
  }
  return vec;
}

function cosineSim(a: Map<string, number>, b: Map<string, number>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const v of a.values()) normA += v * v;
  for (const v of b.values()) normB += v * v;
  const small = a.size <= b.size ? a : b;
  const big = a.size <= b.size ? b : a;
  for (const [k, va] of small) {
    const vb = big.get(k);
    if (vb !== undefined) dot += va * vb;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom > 0 ? dot / denom : 0;
}

// ============================================================
// 主入口：对 AI 输出做事实校验
// ============================================================

/**
 * 对 AI 输出做句子级事实校验
 *
 * @param reply AI 输出的完整回答
 * @param sources 知识库片段（分析师研判正文 + widget 真实数据快照）
 * @returns FactCheckReport（含改写后的 annotatedReply）
 */
export function factCheck(
  reply: string,
  sources: string[],
): FactCheckReport {
  if (!reply.trim() || sources.length === 0) {
    return {
      overall: "low",
      avgScore: 0,
      sentences: [],
      annotatedReply: reply + (sources.length === 0 ? "\n\n（注：本次回答缺少可校验的知识库依据，仅供参考）" : ""),
    };
  }

  const idfIndex = buildIDF(sources);
  const sourceVectors = sources.map((s) => ({
    text: s,
    vec: tfidfVector(s, idfIndex),
  }));

  const sentenceTuples = splitSentences(reply);
  const sentenceChecks: SentenceFactCheck[] = [];

  for (const { sentence } of sentenceTuples) {
    // 跳过太短的句子、纯 markdown 标题、纯列表序号
    const cleanForCheck = sentence
      .replace(/^[#*\->\s\d.]+/, "")
      .replace(/[*`_~]/g, "")
      .trim();
    if (sentence.length < 6 || cleanForCheck.length < 6) {
      sentenceChecks.push({
        sentence,
        score: 1,
        confidence: "high",
      });
      continue;
    }
    const sentVec = tfidfVector(sentence, idfIndex);
    let bestScore = 0;
    let bestSource: string | undefined;
    for (const sv of sourceVectors) {
      const sim = cosineSim(sentVec, sv.vec);
      if (sim > bestScore) {
        bestScore = sim;
        bestSource = sv.text;
      }
    }
    const confidence: FactConfidence =
      bestScore >= HIGH_THRESHOLD
        ? "high"
        : bestScore >= MID_THRESHOLD
          ? "mid"
          : "low";
    sentenceChecks.push({
      sentence,
      score: bestScore,
      confidence,
      matchedSource: bestSource?.slice(0, 80),
    });
  }

  // 计算整体置信度
  const validScores = sentenceChecks
    .filter((c) => c.sentence.length >= 6)
    .map((c) => c.score);
  const avgScore =
    validScores.length > 0
      ? validScores.reduce((a, b) => a + b, 0) / validScores.length
      : 0;

  const overall: FactConfidence =
    avgScore >= HIGH_THRESHOLD
      ? "high"
      : avgScore >= MID_THRESHOLD
        ? "mid"
        : "low";

  // 贴标策略调整：
  // - overall = high → 完全不贴，让回答简洁
  // - overall = mid → 仅在末尾加一行整体提示
  // - overall = low → 末尾加一行"以上结论与知识库匹配度较低，请核实"
  // 不再逐句贴"（仅供参考）"，避免割裂核心观点
  const rawText = sentenceTuples
    .map((t) => t.sentence + t.sep)
    .join("");
  let annotated = rawText;
  if (overall === "low") {
    annotated +=
      "\n\n⚠ 本次回答与知识库匹配度较低，请联系分析师进一步核实。";
  } else if (overall === "mid") {
    annotated += "\n\n以上为综合研判，仅供参考。";
  }

  return {
    overall,
    avgScore,
    sentences: sentenceChecks,
    annotatedReply: annotated,
  };
}
