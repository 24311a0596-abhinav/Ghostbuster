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
