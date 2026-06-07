import { AgentMessage } from "@/types";

interface ChatMessageProps {
  message: AgentMessage;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  if (message.role === "system") {
    return (
      <div className="flex justify-center my-2 animate-fade-in">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-1.5 max-w-2xl">
          <p className="text-[11px] text-[var(--foreground-muted)] font-mono">{message.content}</p>
        </div>
      </div>
    );
  }

  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} my-4 animate-fade-in`}>
      {!isUser && (
        <div className="mr-3 mt-1 w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-[var(--background)]">AI</span>
        </div>
      )}
      <div
        className={`max-w-[72%] rounded-2xl px-5 py-3.5 ${
          isUser
            ? "bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] text-[var(--background)]"
            : "bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)]"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        {message.confidence !== undefined && (
          <div className={`mt-4 pt-3 border-t ${isUser ? "border-white/20" : "border-[var(--border)]"}`}>
            <div className="flex items-center gap-3">
              <span
                className={`text-[10px] uppercase tracking-widest font-semibold ${
                  isUser ? "text-[var(--background)]/70" : "text-[var(--foreground-dim)]"
                }`}
              >
                Confidence
              </span>
              <div
                className={`flex-1 h-1.5 rounded-full overflow-hidden ${
                  isUser ? "bg-white/20" : "bg-[var(--surface-elevated)]"
                }`}
              >
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    message.confidence >= 0.8
                      ? "bg-[var(--success)]"
                      : message.confidence >= 0.6
                        ? "bg-[var(--warning)]"
                        : "bg-[var(--danger)]"
                  }`}
                  style={{ width: `${message.confidence * 100}%` }}
                />
              </div>
              <span
                className={`text-xs font-mono font-semibold ${
                  isUser ? "text-[var(--background)]" : "text-white"
                }`}
              >
                {(message.confidence * 100).toFixed(0)}%
              </span>
            </div>
            {message.confidence < 0.7 && (
              <p
                className={`text-[10px] mt-2 ${
                  isUser ? "text-[var(--background)]/70" : "text-[var(--warning)]"
                }`}
              >
                ⚠ 置信度较低，仅供参考，请结合实际判断
              </p>
            )}
          </div>
        )}
        {message.sources && message.sources.length > 0 && (
          <div className={`mt-3 pt-3 border-t ${isUser ? "border-white/20" : "border-[var(--border)]"}`}>
            <p
              className={`text-[10px] uppercase tracking-widest font-semibold mb-2 ${
                isUser ? "text-[var(--background)]/70" : "text-[var(--foreground-dim)]"
              }`}
            >
              Data Sources
            </p>
            <div className="flex flex-wrap gap-1.5">
              {message.sources.map((src) => (
                <span
                  key={src}
                  className={`text-[10px] px-2 py-0.5 rounded-md ${
                    isUser
                      ? "bg-white/15 text-[var(--background)]"
                      : "bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--foreground-muted)]"
                  }`}
                >
                  {src}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      {isUser && (
        <div className="ml-3 mt-1 w-8 h-8 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-semibold text-[var(--foreground-muted)]">您</span>
        </div>
      )}
    </div>
  );
}
