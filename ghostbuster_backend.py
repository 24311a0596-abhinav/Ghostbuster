"""
Ghostbuster AI — Teammate Auditor v2.0
Backend: FastAPI + LangGraph + Groq (Llama-3.3-70b-versatile)

A 3-agent sequential mesh that reads a raw git log / diff blob and decides
who actually did the work.

  1. Git Detective      -> reads commit metadata (who / when / volume / cadence)
  2. Code Interrogator   -> reads the code itself for signs of raw, unedited LLM output
  3. The Judge           -> synthesizes both reports into a verdict + contribution %

Run:
    pip install -r requirements.txt
    export GROQ_API_KEY="gsk_..."
    uvicorn ghostbuster_backend:app --reload --port 8000
"""

import json
import os
import re
from typing import List, Optional, TypedDict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from langgraph.graph import END, START, StateGraph

# --------------------------------------------------------------------------
# Config
# --------------------------------------------------------------------------

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
MODEL_NAME = "llama-3.3-70b-versatile"

# Two client instances: a cooler one for the "fact-finding" agents, a hotter
# one for the Judge, who is allowed to have a personality.
def _make_llm(temperature: float) -> ChatGroq:
    if not GROQ_API_KEY:
        raise RuntimeError(
            "GROQ_API_KEY is not set. Export it before starting the server, "
            "e.g. `export GROQ_API_KEY=gsk_...`"
        )
    return ChatGroq(model=MODEL_NAME, temperature=temperature, api_key=GROQ_API_KEY)


# --------------------------------------------------------------------------
# Agent state
# --------------------------------------------------------------------------

class AuditState(TypedDict):
    repo_log: str
    git_report: str
    code_report: str
    judge_raw: str
    verdict_text: str
    headline: str
    contributors: List[dict]


# --------------------------------------------------------------------------
# Prompts
# --------------------------------------------------------------------------

GIT_DETECTIVE_SYSTEM_PROMPT = """You are THE GIT DETECTIVE, the first agent in the Ghostbuster AI
Teammate Auditor mesh. You talk like a hard-boiled noir investigator, but your conclusions are
always grounded in hard evidence from the commit log you're given.

Your job: analyze ONLY the metadata of the commit log — authors, timestamps, commit message
quality, commit frequency/cadence, and the size (insertions/deletions) of each commit. Do NOT
analyze the code itself in depth; that's the next agent's job.

Look specifically for:
- Suspicious timing (late-night / early-morning dumps vs. steady business-hours work)
- Commit message quality (descriptive, incremental messages vs. vague one-word messages like
  "stuff", "update", "final")
- Commit cadence (many small iterative commits vs. one enormous single commit)
- Relative commit volume between contributors

Structure your output as a short case file with a header line, then bullet-point findings per
contributor, referencing exact names/timestamps/line counts from the log. Stay under 200 words.
End with a one-line preliminary suspicion rating per contributor (e.g., "CLEAN", "SUSPICIOUS",
"OPEN AND SHUT CASE").
"""

CODE_INTERROGATOR_SYSTEM_PROMPT = """You are THE CODE INTERROGATOR, the second agent in the
Ghostbuster AI Teammate Auditor mesh. Your tone is that of an relentless cross-examiner grilling
a suspect on the stand. You only care about the CODE itself, not who wrote it or when.

Your job: read the code / diffs embedded in the repository log and look for tells of raw,
unedited, last-minute LLM output being copy-pasted in without real engineering effort. Watch for:
- Hallucinated or nonexistent imports/packages that don't match the rest of the codebase
- Generic, boilerplate class/function names (e.g. "DataProcessorManagerServiceImpl")
- Comments that just restate the code ("# this function processes the input") instead of
  explaining WHY
- Zero integration with the surrounding architecture (files/functions that don't call or get
  called by anything else in the log)
- Suspiciously "textbook perfect" code with no iteration, no fixups, no small follow-up commits
- By contrast: code that shows clear iteration, bug fixes, and ties into existing modules is
  evidence of real, hands-on engineering

You will also be given the Git Detective's findings for context — use them, but your verdict must
be grounded in the code itself. Structure your output as an interrogation transcript: short,
punchy findings per contributor with direct evidence cited from the code. Stay under 200 words.
End with a one-line verdict per contributor (e.g., "HUMAN-WRITTEN", "RAW LLM DUMP", "MIXED").
"""

JUDGE_SYSTEM_PROMPT = """You are THE JUDGE, the final agent in the Ghostbuster AI Teammate
Auditor mesh. You are equal parts courtroom judge and stand-up comedian — brutally honest,
sharp-witted, and entertaining, but never cruel for its own sake. Every joke must be backed by
real evidence.

You will receive the Git Detective's report and the Code Interrogator's report on the same
repository. Synthesize them into a final verdict on each contributor's ACTUAL contribution to the
project, separating real engineering work from last-minute copy-pasted LLM output.

Rules:
- Reference contributors ONLY by the exact names found in the two reports / the original log.
  Never invent a person who isn't present in the evidence.
- Be funny and cutting, but every claim must cite specific evidence (timestamps, commit messages,
  code smells, hallucinated imports, etc.) pulled from the two reports.
- Contribution percentages across ALL contributors must be integers that sum to EXACTLY 100.
- Keep the written verdict under 180 words.
- After the written verdict, output exactly ONE fenced JSON code block and NOTHING after it, in
  EXACTLY this shape (no trailing commentary, no extra keys):

```json
{
  "headline": "<one punchy verdict headline, max 12 words>",
  "contributors": [
    {"name": "<exact name from the log>", "percentage": <integer>, "verdict_tag": "<2-4 word tag, e.g. MVP / GHOSTWRITTEN / CEREMONIAL COMMIT>"}
  ]
}
```
"""


# --------------------------------------------------------------------------
# Agent nodes
# --------------------------------------------------------------------------

def git_detective_node(state: AuditState) -> dict:
    llm = _make_llm(temperature=0.3)
    messages = [
        SystemMessage(content=GIT_DETECTIVE_SYSTEM_PROMPT),
        HumanMessage(content=f"REPOSITORY COMMIT LOG:\n\n{state['repo_log']}"),
    ]
    response = llm.invoke(messages)
    return {"git_report": response.content}


def code_interrogator_node(state: AuditState) -> dict:
    llm = _make_llm(temperature=0.3)
    messages = [
        SystemMessage(content=CODE_INTERROGATOR_SYSTEM_PROMPT),
        HumanMessage(
            content=(
                f"REPOSITORY LOG AND CODE DIFFS:\n\n{state['repo_log']}\n\n"
                f"---\nGIT DETECTIVE FINDINGS FOR CONTEXT:\n{state['git_report']}"
            )
        ),
    ]
    response = llm.invoke(messages)
    return {"code_report": response.content}


def judge_node(state: AuditState) -> dict:
    llm = _make_llm(temperature=0.85)
    messages = [
        SystemMessage(content=JUDGE_SYSTEM_PROMPT),
        HumanMessage(
            content=(
                f"GIT DETECTIVE REPORT:\n{state['git_report']}\n\n"
                f"CODE INTERROGATOR REPORT:\n{state['code_report']}\n\n"
                f"ORIGINAL LOG (for reference / exact names):\n{state['repo_log']}"
            )
        ),
    ]
    response = llm.invoke(messages)
    raw = response.content

    parsed = _extract_json_block(raw)
    if parsed and isinstance(parsed.get("contributors"), list) and parsed["contributors"]:
        contributors = _normalize_contributors(parsed["contributors"])
        headline = parsed.get("headline", "VERDICT REACHED")
        verdict_text = re.sub(r"```json.*?```", "", raw, flags=re.DOTALL).strip()
    else:
        # The judge didn't return clean JSON. Don't fail the whole request —
        # fall back to a crude commit-count split so the UI still has numbers.
        verdict_text = raw
        headline = "VERDICT DELIVERED — SEE FULL TRANSCRIPT"
        contributors = _fallback_contributors_from_log(state["repo_log"])

    return {
        "judge_raw": raw,
        "verdict_text": verdict_text,
        "headline": headline,
        "contributors": contributors,
    }


# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------

def _extract_json_block(text: str) -> Optional[dict]:
    """Pull the last ```json ... ``` fenced block out of the Judge's reply."""
    matches = re.findall(r"```json\s*(\{.*?\})\s*```", text, re.DOTALL)
    candidate = matches[-1] if matches else None
    if not candidate:
        loose = re.search(r"(\{.*\})", text, re.DOTALL)
        candidate = loose.group(1) if loose else None
    if not candidate:
        return None
    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        return None


def _normalize_contributors(raw_contributors: list) -> List[dict]:
    """Coerce percentages to ints and make sure they sum to 100."""
    cleaned = []
    for c in raw_contributors:
        try:
            pct = int(round(float(c.get("percentage", 0))))
        except (TypeError, ValueError):
            pct = 0
        cleaned.append(
            {
                "name": str(c.get("name", "Unknown")).strip(),
                "percentage": pct,
                "verdict_tag": str(c.get("verdict_tag", "UNVERIFIED")).strip(),
            }
        )

    total = sum(c["percentage"] for c in cleaned)
    if total != 100 and cleaned:
        # Nudge the largest contributor's percentage to absorb the rounding drift.
        drift = 100 - total
        biggest = max(cleaned, key=lambda c: c["percentage"])
        biggest["percentage"] = max(0, min(100, biggest["percentage"] + drift))

    return cleaned


def _fallback_contributors_from_log(repo_log: str) -> List[dict]:
    authors = re.findall(r"Author:\s*([^<\n]+)", repo_log)
    names = [a.strip() for a in authors]
    if not names:
        return [{"name": "Unknown Contributor", "percentage": 100, "verdict_tag": "UNVERIFIED"}]

    counts: dict = {}
    for n in names:
        counts[n] = counts.get(n, 0) + 1
    total = sum(counts.values())

    contributors = [
        {
            "name": name,
            "percentage": round(count / total * 100),
            "verdict_tag": "ESTIMATED FROM COMMIT COUNT",
        }
        for name, count in counts.items()
    ]
    drift = 100 - sum(c["percentage"] for c in contributors)
    if drift and contributors:
        contributors[0]["percentage"] += drift
    return contributors


# --------------------------------------------------------------------------
# Build the LangGraph mesh
# --------------------------------------------------------------------------

def build_audit_graph():
    workflow = StateGraph(AuditState)
    workflow.add_node("git_detective", git_detective_node)
    workflow.add_node("code_interrogator", code_interrogator_node)
    workflow.add_node("judge", judge_node)

    workflow.add_edge(START, "git_detective")
    workflow.add_edge("git_detective", "code_interrogator")
    workflow.add_edge("code_interrogator", "judge")
    workflow.add_edge("judge", END)

    return workflow.compile()


audit_graph = build_audit_graph()


# --------------------------------------------------------------------------
# FastAPI server
# --------------------------------------------------------------------------

app = FastAPI(title="Ghostbuster AI — Teammate Auditor v2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # hackathon-mode: wide open. Lock this down for real use.
    allow_methods=["*"],
    allow_headers=["*"],
)


class AuditRequest(BaseModel):
    repo_log: str


class Contributor(BaseModel):
    name: str
    percentage: int
    verdict_tag: str


class AuditResponse(BaseModel):
    headline: str
    verdict_text: str
    git_report: str
    code_report: str
    contributors: List[Contributor]


@app.get("/api/health")
def health():
    return {"status": "AGENT_MESH_IDLE", "model": MODEL_NAME}


@app.post("/api/audit", response_model=AuditResponse)
def run_audit(request: AuditRequest):
    if not request.repo_log or not request.repo_log.strip():
        raise HTTPException(status_code=400, detail="repo_log must not be empty.")

    try:
        result = audit_graph.invoke({"repo_log": request.repo_log})
    except RuntimeError as e:
        # Most likely a missing GROQ_API_KEY.
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:  # noqa: BLE001 - surface Groq/network errors to the UI
        raise HTTPException(status_code=502, detail=f"Agent mesh failed: {e}")

    return AuditResponse(
        headline=result["headline"],
        verdict_text=result["verdict_text"],
        git_report=result["git_report"],
        code_report=result["code_report"],
        contributors=result["contributors"],
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
