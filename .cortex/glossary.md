# EasyTax AU - Terminology Glossary

## Australian Tax System (ATO)

**ABN** (Australian Business Number)
11-digit unique identifier for businesses

**ATO** (Australian Taxation Office)
Australia's tax authority (equivalent to IRS in US)

**BAS** (Business Activity Statement)
Quarterly or monthly report for GST, PAYG, and other obligations

**Financial Year (FY)**
July 1 to June 30 (e.g., FY 2024 = July 1, 2023 to June 30, 2024)

**GST** (Goods & Services Tax)
10% value-added tax on most goods and services (similar to VAT, NOT sales tax)

**PAYG** (Pay As You Go)
Withholding tax system for employees and contractors

**TFN** (Tax File Number)
Unique identifier for individuals (equivalent to SSN in US)

---

## Technical Terms

**Cents-Based Currency**
Storing monetary values as integers in cents (e.g., $123.45 = 12345 cents)
Prevents floating-point rounding errors

**E2E Testing**
End-to-end testing using Playwright (simulates real user workflows)

**Instruction Layering v2.0**
Proto cortex strategy: rules (always-loaded) + references (on-demand)

**Monorepo**
Single repository containing multiple packages (web + backend + shared)

**Search Anchor**
Standardized header format for quick lookup (e.g., `### [Pattern Name] Pattern`)

**TDD** (Test-Driven Development)
Write failing test → implement code → refactor

**Type Integrity Trigger**
Requirement to run `pnpm run generate:types` after backend schema changes

---

## Architectural Patterns

**Entity Structure Pattern**
How to define TypeORM entities with proper decorators and relationships

**Currency & Math Pattern**
Using Decimal.js for calculations, storing as cents

**Data Fetching Pattern**
TanStack Query for server state management

**Form Validation Pattern**
React Hook Form + Zod schema validation

---

## Project-Specific Terms

**AGENTS.md**
Deprecated proto cortex file (distributed to PATTERNS.md and copilot-instructions.md)

**WARP.md**
Deleted proto cortex file (was duplicate of CLAUDE.md)

**Technical Map**
Reference table in copilot-instructions.md for which file to read for each task type

---

**Last Updated**: 2026-01-17
