/**
 * Ghostbuster AI — Teammate Auditor v2.0
 * Frontend: single-file React + TypeScript component, Tailwind CSS, Lucide icons.
 *
 * Aesthetic: "Aurevon" — obsidian cyber-dark, glassmorphic panels, rose/orange accent glow.
 *
 * Expects a backend running at API_URL (see ghostbuster_backend.py) exposing:
 *   POST /api/audit  { repo_log: string } -> { headline, verdict_text, git_report,
 *                                              code_report, contributors[] }
 */

import React, { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ChevronRight,
  Code2,
  GitCommit,
  Ghost,
  Loader2,
  Play,
  Radio,
  Scale,
  Search,
  Skull,
  Terminal,
  Trophy,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AgentKey = "gitDetective" | "codeInterrogator" | "judge";
type AgentStatus = "idle" | "running" | "complete" | "error";

interface Contributor {
  name: string;
  percentage: number;
  verdict_tag: string;
}

interface AuditResult {
  headline: string;
  verdict_text: string;
  git_report: string;
  code_report: string;
  contributors: Contributor[];
}

// ---------------------------------------------------------------------------
// Config / mock data
// ---------------------------------------------------------------------------

const API_URL = "http://localhost:8000/api/audit";

const MOCK_REPO_LOG = `commit 8f3a91c2eab4419f9b8e213b7a92c1d4e5f6a7b8
Author: P Sri Abhinav Raman <abhinav.raman@kaizen-ai.dev>
Date:   Mon Sep 14 09:14:22 2026 +0530

    feat(core): adaptive context-window sharding for the retrieval engine

    - Refactored ChunkManager to support dynamic overlap sizing
    - Added regression tests for edge-case token boundaries
    - Wired telemetry hooks for shard rebalancing

 src/core/chunk_manager.py    | 142 +++++++++++++++++++++++++++----
 src/core/retrieval_engine.py |  88 +++++++++++++----
 tests/test_chunk_manager.py  |  76 ++++++++++++++++
 3 files changed, 278 insertions(+), 28 deletions(-)

commit 5b2c8d4f1a6e9370c4b8d2e5f7a1b3c6d9e0f2a4
Author: P Sri Abhinav Raman <abhinav.raman@kaizen-ai.dev>
Date:   Mon Sep 14 14:32:07 2026 +0530

    fix(core): race condition in async shard rebalancer

 src/core/retrieval_engine.py | 34 ++++++----
 1 file changed, 22 insertions(+), 12 deletions(-)

commit 2f4e6a8c1b3d5f7a9c0e2d4f6a8b0c2e4f6a8b0c
Author: P Sri Abhinav Raman <abhinav.raman@kaizen-ai.dev>
Date:   Tue Sep 15 11:02:41 2026 +0530

    refactor(agents): extract shared prompt builder for mesh agents

 src/agents/base_agent.py    | 61 +++++++++++------
 src/agents/prompt_utils.py  | 40 +++++++++++
 2 files changed, 79 insertions(+), 22 deletions(-)

commit 9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7e
Author: P Sri Abhinav Raman <abhinav.raman@kaizen-ai.dev>
Date:   Wed Sep 16 16:48:19 2026 +0530

    test(agents): add integration tests for the LangGraph mesh

 tests/test_mesh_integration.py | 118 +++++++++++++++++++++++++++++
 1 file changed, 118 insertions(+)

commit 0a2c4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4c6d8e
Author: P Sri Abhinav Raman <abhinav.raman@kaizen-ai.dev>
Date:   Thu Sep 17 10:20:05 2026 +0530

    docs(core): document ChunkManager overlap strategy + update README

 README.md                 | 22 +++++++---
 src/core/chunk_manager.py  |  9 ++--
 2 files changed, 22 insertions(+), 9 deletions(-)

commit 1a2b3c4d5e6f7890abcdef1234567890abcdef12
Author: LazyDave <dave.k@kaizen-ai.dev>
Date:   Thu Sep 17 04:07:53 2026 +0530

    stuff

 src/core/everything.py | 1834 +++++++++++++++++++++++++++++++++++++++++++++
 1 file changed, 1834 insertions(+)

diff --git a/src/core/everything.py b/src/core/everything.py
new file mode 100644
+import numpy as np
+import pandas as pd
+from openai_advanced_toolkit import SuperAgent  # not in requirements.txt, doesn't exist
+from langchain.chains.magic import AutoPipeline  # hallucinated submodule
+
+class DataProcessorManagerServiceImpl:
+    """
+    This class processes the data.
+    """
+    def __init__(self):
+        # Initialize the processor
+        self.data = None
+
+    def process_data(self, input_data):
+        # This function processes the input data
+        # and returns the processed result
+        result = input_data
+        return result
+
+def main():
+    print("Hello, World!")
+
+if __name__ == "__main__":
+    main()
`;

const TELEMETRY_LINES = [
  "[MESH] Spinning up agent swarm on kaizen-ai-core...",
  "[MESH] Allocating context window: 3 agents / sequential graph",
  "[GIT_DETECTIVE] Parsing commit metadata stream...",
  "[GIT_DETECTIVE] Cross-referencing timestamps against IST business hours...",
  "[GIT_DETECTIVE] Flagging anomalous commit volume deltas...",
  "[CODE_INTERROGATOR] Walking AST for hallucinated import signatures...",
  "[CODE_INTERROGATOR] Diffing style against existing architectural patterns...",
  "[CODE_INTERROGATOR] Cross-examining boilerplate comment density...",
  "[JUDGE] Ingesting detective + interrogator transcripts...",
  "[JUDGE] Weighing evidence, drafting verdict...",
  "[JUDGE] Calculating contribution percentages...",
];

const AGENT_META: Record<
  AgentKey,
  { label: string; icon: React.ElementType; description: string }
> = {
  gitDetective: {
    label: "Git Detective",
    icon: GitCommit,
    description: "Commit metadata",
  },
  codeInterrogator: {
    label: "Code Interrogator",
    icon: Code2,
    description: "Static analysis",
  },
  judge: {
    label: "The Judge",
    icon: Scale,
    description: "Verdict synthesis",
  },
};

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

function StatusPulse({ active }: { active: boolean }) {
  if (!active) {
    return <span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-600" />;
  }
  return (
    <span className="relative inline-flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
    </span>
  );
}

function statusColor(status: AgentStatus) {
  switch (status) {
    case "running":
      return "border-orange-400/60 shadow-[0_0_25px_-5px_rgba(251,146,60,0.6)]";
    case "complete":
      return "border-rose-400/50 shadow-[0_0_20px_-6px_rgba(244,63,94,0.5)]";
    case "error":
      return "border-red-500/70 shadow-[0_0_20px_-6px_rgba(239,68,68,0.6)]";
    default:
      return "border-white/10";
  }
}

function AgentNode({
  agentKey,
  status,
}: {
  agentKey: AgentKey;
  status: AgentStatus;
}) {
  const meta = AGENT_META[agentKey];
  const Icon = meta.icon;
  return (
    <div
      className={`relative rounded-2xl border bg-black/40 backdrop-blur-xl px-4 py-4 transition-all duration-500 ${statusColor(
        status
      )}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors duration-500 ${
            status === "idle"
              ? "bg-white/5 text-slate-500"
              : "bg-gradient-to-br from-rose-500 to-orange-500 text-black"
          }`}
        >
          {status === "running" ? (
            <Loader2 className="h-4.5 w-4.5 animate-spin" size={18} />
          ) : (
            <Icon size={18} />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-100 truncate">{meta.label}</p>
          <p className="text-[11px] text-slate-500 font-mono truncate">{meta.description}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            status === "idle"
              ? "bg-slate-600"
              : status === "running"
              ? "bg-orange-400 animate-pulse"
              : status === "complete"
              ? "bg-rose-400"
              : "bg-red-500"
          }`}
        />
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
          {status === "idle" && "standby"}
          {status === "running" && "processing"}
          {status === "complete" && "report filed"}
          {status === "error" && "failed"}
        </span>
      </div>
    </div>
  );
}

function TopologyEdge({ lit }: { lit: boolean }) {
  return (
    <div className="flex justify-center py-1">
      <div className="relative h-6 w-px overflow-hidden bg-white/10">
        <div
          className={`absolute inset-x-0 top-0 h-full bg-gradient-to-b from-rose-500 to-orange-500 transition-transform duration-700 ${
            lit ? "translate-y-0" : "-translate-y-full"
          }`}
        />
      </div>
    </div>
  );
}

/** Very small heuristic "syntax highlighter" for agent report text — no external deps. */
function HighlightedReport({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <pre className="whitespace-pre-wrap break-words font-mono text-[12.5px] leading-relaxed text-slate-300">
      {lines.map((line, i) => {
        let className = "";
        if (/^(CLEAN|HUMAN-WRITTEN|VERIFIED|MVP)/i.test(line.trim())) {
          className = "text-emerald-400";
        } else if (
          /(SUSPICIOUS|RAW LLM DUMP|GHOST|FLAG|OPEN AND SHUT CASE)/i.test(line)
        ) {
          className = "text-rose-400";
        } else if (/^[A-Z ]{4,}:?$/.test(line.trim())) {
          className = "text-orange-300 font-semibold";
        } else if (/^[-•]/.test(line.trim())) {
          className = "text-slate-300";
        }
        return (
          <div key={i} className={className || undefined}>
            {line || "\u00A0"}
          </div>
        );
      })}
    </pre>
  );
}

function ReportCard({
  icon: Icon,
  title,
  accent,
  children,
}: {
  icon: React.ElementType;
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden">
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.02] px-4 py-2.5">
        <Icon size={14} className={accent} />
        <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
          {title}
        </span>
      </div>
      <div className="max-h-64 overflow-y-auto px-4 py-3">{children}</div>
    </div>
  );
}

function ContributionBar({ contributors }: { contributors: Contributor[] }) {
  const palette = [
    "from-rose-500 to-orange-400",
    "from-slate-600 to-slate-500",
    "from-orange-500 to-amber-400",
    "from-rose-600 to-rose-400",
  ];
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-4">
      <div className="flex items-center gap-2 pb-3">
        <Trophy size={14} className="text-orange-300" />
        <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
          Contribution Breakdown
        </span>
      </div>

      <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/5">
        {contributors.map((c, i) => (
          <div
            key={c.name}
            style={{ width: `${Math.max(c.percentage, 1)}%` }}
            className={`h-full bg-gradient-to-r ${palette[i % palette.length]} transition-all duration-1000 ease-out`}
          />
        ))}
      </div>

      <div className="mt-4 space-y-2.5">
        {contributors.map((c, i) => (
          <div key={c.name} className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={`h-2 w-2 shrink-0 rounded-full bg-gradient-to-r ${palette[i % palette.length]}`}
              />
              <span className="truncate text-sm text-slate-200">{c.name}</span>
              <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wide text-slate-400">
                {c.verdict_tag}
              </span>
            </div>
            <span className="shrink-0 font-mono text-sm font-semibold text-slate-100">
              {c.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function GhostbusterAuditor() {
  const [repoLog, setRepoLog] = useState(MOCK_REPO_LOG);
  const [meshActive, setMeshActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [telemetry, setTelemetry] = useState<string[]>([]);
  const [agentStatus, setAgentStatus] = useState<Record<AgentKey, AgentStatus>>({
    gitDetective: "idle",
    codeInterrogator: "idle",
    judge: "idle",
  });

  const telemetryRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    telemetryRef.current?.scrollTo({ top: telemetryRef.current.scrollHeight });
  }, [telemetry]);

  useEffect(() => {
    return () => timersRef.current.forEach((t) => window.clearTimeout(t));
  }, []);

  function resetRun() {
    setError(null);
    setResult(null);
    setTelemetry([]);
    setAgentStatus({ gitDetective: "idle", codeInterrogator: "idle", judge: "idle" });
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  }

  async function runAudit() {
    if (isLoading) return;
    resetRun();
    setMeshActive(true);
    setIsLoading(true);

    // Simulated telemetry stream, timed to roughly track the 3 pipeline stages.
    TELEMETRY_LINES.forEach((line, i) => {
      const t = window.setTimeout(() => {
        setTelemetry((prev) => [...prev, line]);
      }, 300 + i * 380);
      timersRef.current.push(t);
    });

    const stageTimers: [number, Partial<Record<AgentKey, AgentStatus>>][] = [
      [200, { gitDetective: "running" }],
      [1800, { gitDetective: "complete", codeInterrogator: "running" }],
      [3600, { codeInterrogator: "complete", judge: "running" }],
    ];
    stageTimers.forEach(([delay, patch]) => {
      const t = window.setTimeout(() => {
        setAgentStatus((prev) => ({ ...prev, ...patch }));
      }, delay);
      timersRef.current.push(t);
    });

    // Guarantee the staged animation has time to play out even on a fast response.
    const minAnimation = new Promise((resolve) => {
      const t = window.setTimeout(resolve, 4600);
      timersRef.current.push(t);
    });

    const fetchAudit = fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo_log: repoLog }),
    }).then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Server responded ${res.status}`);
      }
      return res.json() as Promise<AuditResult>;
    });

    try {
      const [data] = await Promise.all([fetchAudit, minAnimation]);
      setResult(data);
      setAgentStatus({ gitDetective: "complete", codeInterrogator: "complete", judge: "complete" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown mesh failure.";
      setError(message);
      setAgentStatus((prev) => {
        const next = { ...prev };
        (Object.keys(next) as AgentKey[]).forEach((k) => {
          if (next[k] === "running") next[k] = "error";
        });
        return next;
      });
    } finally {
      setIsLoading(false);
      setMeshActive(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#030712] text-slate-100">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-rose-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-[28rem] w-[28rem] rounded-full bg-orange-600/10 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Top nav */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/10 bg-black/30 backdrop-blur-xl px-6 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-orange-500">
            <Ghost size={17} className="text-black" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-slate-100">
              Ghostbuster AI
            </p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
              Teammate Auditor v2.0
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
          <StatusPulse active={meshActive} />
          <span className="text-xs font-mono text-slate-400">
            Agent Mesh <span className="text-slate-200">{meshActive ? "Active" : "Idle"}</span>
          </span>
        </div>
      </header>

      {/* Main layout */}
      <main className="relative z-10 mx-auto grid max-w-[1500px] grid-cols-1 gap-6 p-6 lg:grid-cols-12">
        {/* LEFT — input terminal */}
        <section className="lg:col-span-4 flex flex-col gap-4">
          <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.02] px-4 py-2.5">
              <Terminal size={14} className="text-rose-400" />
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                repo_log.diff
              </span>
              <span className="ml-auto text-[10px] font-mono text-slate-600">
                kaizen-ai-core
              </span>
            </div>
            <textarea
              value={repoLog}
              onChange={(e) => setRepoLog(e.target.value)}
              spellCheck={false}
              className="h-[480px] w-full resize-none bg-transparent p-4 font-mono text-[12px] leading-relaxed text-slate-300 outline-none placeholder:text-slate-600"
              placeholder="Paste a git log / diff here..."
            />
          </div>

          <button
            onClick={runAudit}
            disabled={isLoading || !repoLog.trim()}
            className="group relative flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-gradient-to-r from-rose-500 to-orange-500 px-5 py-3 font-medium text-black transition-all duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100"
          >
            {isLoading ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Mesh Deliberating...
              </>
            ) : (
              <>
                <Play size={17} />
                Deploy Agent Mesh
                <ChevronRight
                  size={16}
                  className="transition-transform duration-300 group-hover:translate-x-0.5"
                />
              </>
            )}
          </button>

          {error && (
            <div className="flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-400" />
              <div className="text-xs text-red-300">
                <p className="font-medium">Mesh failed to reach a verdict.</p>
                <p className="mt-0.5 text-red-400/80 font-mono">{error}</p>
                <p className="mt-1 text-red-400/60">
                  Check that the backend is running on :8000 and GROQ_API_KEY is set.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* CENTER — topology map */}
        <section className="lg:col-span-3 flex flex-col">
          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-4 flex-1">
            <div className="flex items-center gap-2 pb-4">
              <Radio size={14} className="text-orange-300" />
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Execution Topology
              </span>
            </div>

            <AgentNode agentKey="gitDetective" status={agentStatus.gitDetective} />
            <TopologyEdge lit={agentStatus.gitDetective === "complete"} />
            <AgentNode agentKey="codeInterrogator" status={agentStatus.codeInterrogator} />
            <TopologyEdge lit={agentStatus.codeInterrogator === "complete"} />
            <AgentNode agentKey="judge" status={agentStatus.judge} />

            <div className="mt-6 flex items-center gap-2 border-t border-white/10 pt-4">
              <Activity size={13} className="text-slate-500" />
              <span className="text-[11px] font-mono text-slate-500">
                {meshActive ? "sequential graph running..." : "graph compiled · standby"}
              </span>
            </div>
          </div>
        </section>

        {/* RIGHT — results */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          {!result && !isLoading && !error && (
            <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/20 p-10 text-center">
              <Search size={28} className="mb-3 text-slate-600" />
              <p className="text-sm text-slate-500">
                No verdict yet. Deploy the agent mesh to interrogate the log.
              </p>
            </div>
          )}

          {isLoading && (
            <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl overflow-hidden">
              <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.02] px-4 py-2.5">
                <Activity size={14} className="text-rose-400 animate-pulse" />
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Live Telemetry
                </span>
              </div>
              <div
                ref={telemetryRef}
                className="h-64 overflow-y-auto px-4 py-3 font-mono text-[12px] leading-relaxed text-slate-400"
              >
                {telemetry.map((line, i) => (
                  <div key={i} className="text-slate-400">
                    <span className="text-rose-500/70">›</span> {line}
                  </div>
                ))}
                <div className="mt-1 inline-block h-3.5 w-1.5 animate-pulse bg-orange-400/70" />
              </div>
            </div>
          )}

          {result && (
            <>
              <div className="rounded-2xl border border-rose-400/30 bg-gradient-to-br from-rose-500/10 to-orange-500/5 backdrop-blur-xl p-4">
                <div className="flex items-center gap-2">
                  <Skull size={15} className="text-rose-400" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-rose-400/80">
                    Final Verdict
                  </span>
                </div>
                <p className="mt-1.5 text-base font-semibold text-slate-100">
                  {result.headline}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                  {result.verdict_text}
                </p>
              </div>

              <ContributionBar contributors={result.contributors} />

              <ReportCard icon={GitCommit} title="git_detective.log" accent="text-rose-400">
                <HighlightedReport text={result.git_report} />
              </ReportCard>

              <ReportCard icon={Code2} title="code_interrogator.log" accent="text-orange-400">
                <HighlightedReport text={result.code_report} />
              </ReportCard>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
