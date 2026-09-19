# Ghostbuster AI — Teammate Auditor v2.0

<p align="center">
  <strong>Autonomous Multi-Agent Forensics Mesh for Codebase Auditing & Contribution Verification</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python" alt="Python Version" />
  <img src="https://img.shields.io/badge/FastAPI-0.110%2B-009688?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/LangGraph-StateGraph-orange?style=for-the-badge" alt="LangGraph" />
  <img src="https://img.shields.io/badge/Inference-Groq_LPU-f55036?style=for-the-badge" alt="Groq" />
  <img src="https://img.shields.io/badge/Frontend-React_19_+_Vite-61dafb?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Styling-Tailwind_CSS-38bdf8?style=for-the-badge&logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</p>

---

## 📌 Executive Overview

In collaborative hackathons and distributed sprints, verifying genuine engineering effort against synthetic, bulk-generated AI commits is an unsolved attribution problem. 

**Ghostbuster AI** operates as a distributed forensic audit mesh. By decoupling timeline analysis from semantic code inspection, it reconstructs engineering workflows from raw git logs and diff streams. The pipeline autonomously identifies synthetic LLM boilerplate, isolates unintegrated dependencies, audits commit cadences, and computes an objective contribution breakdown with high-fidelity arbitration.

---

## 🏛️ System Architecture

Ghostbuster AI uses an asynchronous client-server architecture. The backend manages a typed state graph executing across high-throughput Groq LPUs, while the frontend delivers a hardware-accelerated telemetry cockpit.
┌─────────────────────────────────────────────────────────────────────────────┐
│                          React + Vite Frontend (SPA)                        │
│   • Reactive Topology Visualizer     • Real-time Agent State Telemetry      │
│   • Lucide Micro-indicators          • Tailwind Utility-First Engine        │
└──────────────────────────────────────┬──────────────────────────────────────┘
│ HTTP POST /api/audit (JSON)
▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       FastAPI Forensics Ingress Gateway                      │
│   • Strict Pydantic v2 Contracts     • Starlette CORS Middleware Execution   │
│   • Uvicorn ASGI Event Loop          • Dynamic Groq Runtime Config          │
└──────────────────────────────────────┬──────────────────────────────────────┘
│ State Ingestion
▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        LangGraph Multi-Agent Mesh                           │
│                                                                             │
│   [START] ──► (Git Detective) ──► (Code Interrogator) ──► (The Judge) ──► [END]
│                      │                     │                    │           │
│                      ▼                     ▼                    ▼           │
│           Llama-3.3-70b-versatile via Groq LPUs (Sub-second Latency)        │
└─────────────────────────────────────────────────────────────────────────────┘

---

## 🤖 Multi-Agent Mesh Topology

The reasoning engine avoids monolithic chain anti-patterns by executing a discrete, typed `StateGraph`:

AuditState {
repo_log: str
git_report: str
code_report: str
judge_raw: str
verdict_text: str
headline: str
contributors: List[Contributor]
}

### 1. Git Detective Node
* **Domain:** Metadata Forensics & Temporal Clustering.
* **Function:** Evaluates commit frequencies, commit message entropy, late-night code dumps, and commit sizes (insertions/deletions).
* **Output:** Generates a noir-style structured investigator case file with individual suspicion ratings (`CLEAN`, `SUSPICIOUS`, `OPEN AND SHUT CASE`).

### 2. Code Interrogator Node
* **Domain:** Semantic Static Analysis & AI Provenance.
* **Function:** Cross-examines the code diffs for hallmarks of unedited model dumps: hallucinated module imports, generic boilerplate classes (`DataProcessorManagerServiceImpl`), restating comments, and unintegrated interfaces.
* **Output:** Direct interrogation findings detailing whether the code demonstrates genuine manual iteration or disconnected synthetic text.

### 3. The Judge Node
* **Domain:** Final Multi-Source Synthesis & Arbitration.
* **Function:** Combines findings from both upstream agents against the original git log. Synthesizes a decisive, sharp verdict and computes normalized integer contribution percentages across all verified contributors.
* **Fault Tolerance:** Includes defensive regex extraction and algorithmic fallback distribution (`_fallback_contributors`) to guarantee valid JSON responses even during model formatting drift.

---

## 🛠️ Technology Stack

| Layer | Technologies | Key Capabilities |
| :--- | :--- | :--- |
| **Agent Orchestration** | LangGraph, LangChain Core | Cyclic directed state graph, typed transitions, execution barriers |
| **Inference Engine** | Groq LPU Cloud, Llama-3.3-70b | Low-latency inference, dynamic temperature allocation per agent |
| **API Backend** | FastAPI, Uvicorn, Pydantic v2 | Non-blocking ASGI loop, strict input validation, CORS enforcement |
| **Frontend Client** | React 19, TypeScript, Vite | Type-safe reactivity, optimized tree-shaking, sub-second HMR |
| **Interface Styling** | Tailwind CSS, Lucide React | Hardware-accelerated transitions, custom cybernetic UI scheme |

---

## 🚀 Getting Started

### Prerequisites
* **Python 3.10+**
* **Node.js 18+** & **npm**
* **Groq API Key** (for production mode)

---

### Backend Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/24311a0596-abhinav/Ghostbuster.git](https://github.com/24311a0596-abhinav/Ghostbuster.git)
   cd Ghostbuster
