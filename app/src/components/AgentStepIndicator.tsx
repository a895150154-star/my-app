import { AgentLoopState } from "@/types";

interface AgentStepIndicatorProps {
  state: AgentLoopState;
}

export default function AgentStepIndicator({ state }: AgentStepIndicatorProps) {
  if (state.status === "idle") return null;

  const statusConfig = {
    running: { label: "EXECUTING", dot: "bg-[var(--accent)]", text: "text-[var(--accent)]" },
    complete: { label: "COMPLETED", dot: "bg-[var(--success)]", text: "text-[var(--success)]" },
    error: { label: "FAILED", dot: "bg-[var(--danger)]", text: "text-[var(--danger)]" },
    idle: { label: "IDLE", dot: "bg-[var(--foreground-dim)]", text: "text-[var(--foreground-dim)]" },
  };
  const cfg = statusConfig[state.status];

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-elevated)]/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${state.status === "running" ? "animate-pulse" : ""}`} />
            <span className={`text-[10px] font-semibold uppercase tracking-widest ${cfg.text}`}>
              Agent Loop · {cfg.label}
            </span>
          </div>
          <span className="text-[10px] text-[var(--foreground-dim)] font-mono">
            {state.currentStep}/{state.steps.length}
          </span>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {state.steps.map((step, idx) => {
          const isLast = idx === state.steps.length - 1;
          return (
            <div key={step.step} className="relative">
              {!isLast && (
                <div
                  className={`absolute left-[11px] top-6 bottom-[-12px] w-px ${
                    step.status === "done" ? "bg-[var(--success)]/30" : "bg-[var(--border)]"
                  }`}
                />
              )}
              <div className="flex items-start gap-3">
                <div className="relative w-6 h-6 flex items-center justify-center flex-shrink-0">
                  {step.status === "done" ? (
                    <div className="w-6 h-6 rounded-full bg-[var(--success)]/20 border border-[var(--success)] flex items-center justify-center">
                      <svg className="w-3 h-3 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : step.status === "running" ? (
                    <div className="w-6 h-6 rounded-full bg-[var(--accent-glow)] border border-[var(--accent)] flex items-center justify-center">
                      <div className="w-3 h-3 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : step.status === "failed" ? (
                    <div className="w-6 h-6 rounded-full bg-[var(--danger)]/20 border border-[var(--danger)] flex items-center justify-center">
                      <svg className="w-3 h-3 text-[var(--danger)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center">
                      <span className="text-[10px] font-mono text-[var(--foreground-dim)]">{step.step}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 pt-0.5">
                  <p
                    className={`text-xs font-medium ${
                      step.status === "done"
                        ? "text-[var(--foreground-muted)]"
                        : step.status === "running"
                          ? "text-white"
                          : "text-[var(--foreground-dim)]"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-[10px] text-[var(--foreground-dim)] uppercase tracking-wider mt-0.5">
                    Step {step.step} · {step.action}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
