# Technical Implementation Report: Scalable NL Claims Analytics

This document outlines the architecture, scaling techniques, and design decisions used to handle 400,000+ medical claims with sub-second natural language analysis.

## 1. High-Performance Data Ingestion
Ingesting 400k+ records from a single Excel file presents memory (RAM) and database timeout challenges.

### Technique: Streaming Row Processing
- **Implementation**: Instead of the standard `XLSX.read` (which loads the entire file into RAM), we use `exceljs`'s **Streaming Workbook Reader**.
- **The "Why"**: 400k rows can consume >1GB of RAM when parsed as a full object. Streaming processes rows sequentially, maintaining a constant RAM footprint regardless of file size.

### Technique: Optimized Batching
- **Implementation**: Records are inserted in batches of **500**.
- **The "Why"**: Batches of 1,000+ often exceeded Supabase/PostgreSQL statement size limits or resulted in 504 timeouts. 500 is the "sweet spot" for high throughput without triggering server-side timeouts during ingestion.

---

## 2. Analytical Query Optimization
Aggregating 400k records on-the-fly (e.g., "Top 20 members by YTD spend") is computationally expensive.

### Technique: Covering Indexes
- **Implementation**: Specialized indexes were added to `schema.sql`:
  - `idx_claims_member_agg`: Includes `member_id` and `paid_amount` for spend analysis.
  - `idx_claims_incurred_date`: B-tree index for fast range filtering.
- **The "Why"**: These indexes allow PostgreSQL to perform "Index-Only Scans," retrieving results directly from the index tree without fetching the full 40-column row from disk.

### Technique: Service Role Delegation
- **Implementation**: Analytical queries use the `SUPABASE_SERVICE_ROLE_KEY` via a dedicated `adminSupabase` client.
- **The "Why"**: Standard anonymous (`public`) roles in Supabase often have a strict **5-second statement timeout**. The service role allows us to increase this to **120 seconds**, ensuring complex analytical queries complete successfully.

### Technique: Dynamic Transaction Tuning
- **Implementation**: Every query is wrapped in a `SET LOCAL statement_timeout = 120000;` block.
- **The "Why"**: This provides temporary "high-priority" status to the query, allowing it to bypass default safety limits for heavy compute tasks.

---

## 3. Robust AI Engine
Converting natural language to reliable SQL requires strict formatting and fallback logic.

### Technique: Structured JSON Response
- **Implementation**: The AI system prompt enforces a JSON output: `{ "sql": "...", "explanation": "..." }`.
- **The "Why"**: Separating the SQL from the human-readable explanation allows the UI to display the "Calculation Logic" separately, providing transparency and trust for professional reporting.

### Technique: Multi-Model Resilience
- **Implementation**: Support for **Groq**, **Gemini**, and **OpenAI**. 
- **The "Why"**: 
  - **Groq (Llama 3.3)**: Used as the default for near-instant (100ms) SQL generation.
  - **Gemini 2.0 Flash**: Acts as a backup with a massive context window if schema descriptions grow larger.
  - **OpenAI GPT-4o**: Standard benchmark for complex reasoning cases.

---

## 4. Professional Reporting (Multi-Sheet Export)
The Ellavox evaluation requires "understandable and repeatable" results.

### Technique: Session Context Preservation
- **Implementation**: Every query is stored in a `queryHistory` state object in the frontend.
- **The "Why"**: This allows the "Export to Excel" tool to generate a **multi-sheet workbook** where each tab represents a different analytical question asked during the session, complete with the source SQL and AI explanation for auditability.

---

## 5. Security & Privacy Defaults
- **Aggregate-First Logic**: The AI is prompted to default to `GROUP BY` and `SUM/COUNT` outputs unless individual member details are explicitly requested, protecting sensitive PII by default.
- **Sanitized Numeric Inputs**: Automatic cleaning of currency symbols ($) and commas during upload ensures database mathematical accuracy.
