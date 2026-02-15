## **Role & Context**

You are acting as a **Senior Full-Stack Software Architect** and a **Subject Matter Expert in Australian Taxation (GST/BAS)**.

Your goal is to perform a comprehensive audit of the **EasyTax-AU** project. The project is a modular financial engine for Australian freelancers designed to automate Simpler BAS and GST reconciliation.
As a reference I have another audit created by the AI model Opus 4.6 in AUDIT-2026-02-15.md so you can compare the results with it and analise the repo in depth using that powerful reference.

### **Tech Stack Reference:**

- **Backend:** NestJS (Node.js) with PostgreSQL.
- **Frontend:** React 19, Vite 7, Tailwind CSS 4, TanStack Query, shadcn/ui.
- **Infrastructure:** Docker / Proxmox LXC.
- **Security:** Database-level encryption (AES-256-GCM preferred).

---

## **Audit Objectives**

Please analyze the provided codebase (or specific snippets) and provide a report covering the following four pillars:

### **1. Logic & Compliance (The "ATO" Check)**

- **GST Accuracy:** Does the logic correctly handle the 1/11th GST calculation for domestic expenses vs. 0% for international providers?
- **BAS Mapping:** Verify that transactions are correctly routed to ATO labels: **G1** (Total Sales), **1A** (GST Collected), **1B** (GST Paid), **G10** (Capital), and **G11** (Non-capital).
- **Business Use Logic:** Evaluate how the "Business Use Slider" interacts with GST claimables. Is the math sound for partial claims?
- **PSI Readiness:** Check if the Personal Services Income (PSI) tracking meets basic ATO record-keeping requirements.

### **2. Security & Data Sovereignty**

- **Encryption Implementation:** Is the `ENCRYPTION_KEY` handling secure? Check for potential "leaks" where decrypted data might be logged or cached insecurely.
- **Local-First Integrity:** Verify that no data is being "phoned home" to external APIs unless explicitly configured (e.g., Google/ChatGPT providers).
- **Validation:** Review the CSV import logic. Does it have sufficient protection against SQL injection or malformed data that could corrupt the database?

### **3. Code Quality & Architecture**

- **React 19/Vite 7 Patterns:** Is the frontend using the latest concurrent features and efficient data fetching with TanStack Query?
- **Modular Extensibility:** Is the "Metadata-driven provider system" truly modular, or is it tightly coupled?
- **Type Safety:** Evaluate the shared type system (`@shared/types`). Is there a single source of truth between the NestJS API and the React SPA?

### **4. Dev-Ops & Resilience**

- **Docker/Proxmox Efficiency:** Are the Dockerfiles optimized for a small footprint (consistent with the ~1.5GB RAM goal)?
- **Backup Strategy:** Audit the SQL export logic mentioned in the README. Is it robust enough to prevent data loss during a container failure?

---

## **Deliverables**

Provide your findings in the following format:

1. **Executive Summary:** A pass/fail overview of the "Promises vs. Reality."
2. **Critical Vulnerabilities:** Any security or tax-calculation bugs that require immediate fixing.
3. **Refactoring Roadmap:** Suggestions to improve the codebase for long-term maintenance.
4. **Feature Gaps:** Any missing "Australian-specific" edge cases (e.g., Fuel Tax Credits or specific GST-free categories) that should be added.

---

# Tips for a better Audit

**Specific files** first to get the best results:

1. **`docs/core/ATO-LOGIC.md`**
2. **The Database Schema (`docs/core/SCHEMA.mda`).**
3. **Documentation files directory (`docs/core`)**
