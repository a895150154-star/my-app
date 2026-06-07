"use client";

import React from "react";

/**
 * 轻量 markdown 渲染器 —— 专门给 FIN AI 的回复格式优化
 *
 * 支持的语法（仅 LLM 实际会输出的）：
 *   ## 二级标题
 *   ### 三级标题
 *   **加粗**
 *   - 列表项
 *   1. 列表项
 *   段落间空行
 *
 * 不引入 react-markdown 是为了：
 * - 零额外依赖
 * - 完全受控的视觉（贴合 design system 的字号 / 色彩 token）
 * - 不会被 LLM 的奇怪输出（如 ``` 代码块）破坏布局
 */

interface Props {
  text: string;
  className?: string;
}

interface Block {
  kind: "h2" | "h3" | "p" | "ul" | "ol";
  text?: string;
  items?: string[];
}

/**
 * 渲染前清洗：把 LLM 偶尔仍会输出的装饰符号统一成简洁标点
 * - 双破折号 —— / -- → 句号
 * - 末尾的 "注："、"补充：" 段落直接吃掉
 */
function sanitize(text: string): string {
  let s = text.replace(/——+|--+/g, "。");
  // 删掉"## 注："/"注："这种末尾备注段（贪婪到结尾）
  s = s.replace(/\n+(##\s*)?(注|备注|补充)[：:][\s\S]*$/m, "");
  // 双句号 / 句号紧跟空格句号 → 单句号
  s = s.replace(/。{2,}/g, "。");
  return s;
}

function parseBlocks(text: string): Block[] {
  const lines = sanitize(text).replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let listBuffer: { kind: "ul" | "ol"; items: string[] } | null = null;
  let paraBuffer: string[] = [];

  const flushPara = () => {
    if (paraBuffer.length > 0) {
      blocks.push({ kind: "p", text: paraBuffer.join(" ").trim() });
      paraBuffer = [];
    }
  };
  const flushList = () => {
    if (listBuffer) {
      blocks.push({ kind: listBuffer.kind, items: listBuffer.items });
      listBuffer = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) {
      flushPara();
      flushList();
      continue;
    }

    // 标题
    const h2 = /^##\s+(.+)$/.exec(line);
    if (h2) {
      flushPara();
      flushList();
      blocks.push({ kind: "h2", text: h2[1].trim() });
      continue;
    }
    const h3 = /^###\s+(.+)$/.exec(line);
    if (h3) {
      flushPara();
      flushList();
      blocks.push({ kind: "h3", text: h3[1].trim() });
      continue;
    }

    // 无序列表
    const ul = /^[-*]\s+(.+)$/.exec(line);
    if (ul) {
      flushPara();
      if (listBuffer?.kind === "ul") {
        listBuffer.items.push(ul[1].trim());
      } else {
        flushList();
        listBuffer = { kind: "ul", items: [ul[1].trim()] };
      }
      continue;
    }

    // 有序列表
    const ol = /^(\d+)[.、)]\s*(.+)$/.exec(line);
    if (ol) {
      flushPara();
      if (listBuffer?.kind === "ol") {
        listBuffer.items.push(ol[2].trim());
      } else {
        flushList();
        listBuffer = { kind: "ol", items: [ol[2].trim()] };
      }
      continue;
    }

    // 普通段落（多行合并为一段，直到遇到空行 / 标题 / 列表）
    flushList();
    paraBuffer.push(line);
  }
  flushPara();
  flushList();
  return blocks;
}

/**
 * 把单行 inline markdown 渲染为 React 节点
 * 仅支持 **粗体**（其它 _ ~ ` 一律去掉装饰符显示原文，避免奇怪输出）
 */
function renderInline(text: string): React.ReactNode[] {
  // 先把成对的 ** 处理为 <strong>
  const out: React.ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      out.push(stripInlineMarks(text.slice(last, m.index)));
    }
    out.push(
      <strong key={`b${key++}`} className="font-semibold text-[var(--color-text)]">
        {stripInlineMarks(m[1])}
      </strong>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    out.push(stripInlineMarks(text.slice(last)));
  }
  return out;
}

/** 去掉残留的 markdown 装饰符（避免 LLM 输出 *italic* / `code` 时显示原始符号） */
function stripInlineMarks(s: string): string {
  return s.replace(/(?<!\*)\*(?!\*)/g, "").replace(/`/g, "");
}

export default function MarkdownLite({ text, className }: Props) {
  const blocks = parseBlocks(text);
  return (
    <div className={className}>
      {blocks.map((b, i) => {
        if (b.kind === "h2") {
          return (
            <h3
              key={i}
              className="text-[var(--font-body)] font-semibold text-[var(--color-text)] mt-3 mb-1.5 first:mt-0"
            >
              {renderInline(b.text ?? "")}
            </h3>
          );
        }
        if (b.kind === "h3") {
          return (
            <h4
              key={i}
              className="text-[var(--font-body-sm)] font-semibold text-[var(--color-text)] mt-2.5 mb-1 first:mt-0"
            >
              {renderInline(b.text ?? "")}
            </h4>
          );
        }
        if (b.kind === "ul") {
          return (
            <ul
              key={i}
              className="my-1.5 space-y-1 text-[var(--font-body-sm)] text-[var(--color-text)] leading-relaxed list-none"
            >
              {b.items?.map((it, j) => (
                <li key={j} className="flex gap-2">
                  <span className="text-[var(--color-text-subtle)] shrink-0">·</span>
                  <span className="flex-1">{renderInline(it)}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (b.kind === "ol") {
          return (
            <ol
              key={i}
              className="my-1.5 space-y-1 text-[var(--font-body-sm)] text-[var(--color-text)] leading-relaxed list-none"
            >
              {b.items?.map((it, j) => (
                <li key={j} className="flex gap-2">
                  <span className="text-[var(--color-text-subtle)] font-mono shrink-0 min-w-[1.2em]">
                    {j + 1}.
                  </span>
                  <span className="flex-1">{renderInline(it)}</span>
                </li>
              ))}
            </ol>
          );
        }
        return (
          <p
            key={i}
            className="text-[var(--font-body-sm)] text-[var(--color-text)] leading-relaxed my-1.5 first:mt-0 last:mb-0"
          >
            {renderInline(b.text ?? "")}
          </p>
        );
      })}
    </div>
  );
}
