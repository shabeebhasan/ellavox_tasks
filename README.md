# Claims Natural Language Query POC

A powerful prototype designed to ingest medical claims data and perform deep analysis using natural language queries powered by Groq, Gemini, and OpenAI.

## 🚀 Key Features
- **40+ Clinical Columns**: Support for Diagnosis codes, CPT/DRG, and detailed financial breakdowns.
- **Large Dataset Support**: Efficiently handles 400,000+ records using streaming uploads.
- **One-Click Sync**: Automatically initializes or resets the database schema from the UI.
- **Multi-Model Support**: Defaults to **Groq (Llama 3.3)** for extreme speed and reliability.
- **Technical Implementation Report**: [Detailed architecture and scaling strategies](./implementation_plan.md)

---

## 🛠 Setup Instructions

### 1. Configure Environment Variables
Copy `.env.local.example` to `.env.local` and fill in the required keys.

| Variable | Description | Source |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL | [Supabase Settings > API](https://supabase.com/dashboard/project/_/settings/api) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public client-side API key | [Supabase Settings > API](https://supabase.com/dashboard/project/_/settings/api) |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret admin key (required for Setup/Sync and high-performance queries) | [Supabase Settings > API](https://supabase.com/dashboard/project/_/settings/api) |
| `GROQ_API_KEY` | (Default) API Key for Groq Llama 3.3 | [Groq Console](https://console.groq.com/keys) |
| `GEMINI_API_KEY` | API Key for Google Gemini 2.0 Flash | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `OPENAI_API_KEY` | API Key for OpenAI GPT-4o | [OpenAI Dashboard](https://platform.openai.com/api-keys) |
| `NEXT_PUBLIC_ENABLE_POLLING` | Set to `true` to enable real-time count updates during upload (use `false` for 400k+ records) | Set manually |

### 2. Initialize the Database
There are two ways to set up the 40-column database schema:

#### Option A: One-Click Sync (Recommended)
1. Run the app (`npm run dev`).
2. Click the **"Sync DB Structure"** button at the top of the dashboard.
3. This automatically runs `schema.sql` and sets up all tables and AI functions.

#### Option B: Manual SQL Upload
1. Open your [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql).
2. Copy the contents of the `schema.sql` file in this project.
3. Paste and **Run** the script.

### 3. Install and Run
```bash
npm install
npm run dev
```

---

## 🏠 Running Supabase Locally (Alternative)

If you prefer to run the entire stack locally instead of using Supabase Cloud:

### 1. Prerequisites
- **Docker Desktop** (Running)
- **Supabase CLI**: [Install guide](https://supabase.com/docs/guides/cli)

### 2. Start Local Supabase
This project is already initialized. Run the following in your terminal:
```bash
supabase start
```
> [!NOTE]
> The first run will download several Docker images (~500MB).

### 3. Update Environment Variables
Once started, run `supabase status` to get your local keys. Update `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`: `http://localhost:54321`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (Use the `anon key` from status)
- `SUPABASE_SERVICE_ROLE_KEY`: (Use the `service_role key` from status)

### 4. Setup Tables
After starting, click the **"Sync DB Structure"** button in the app (or run `supabase db reset`).

---

## 📊 Usage Guide

1. **Sync Database**: Use the "Sync DB Structure" button if you haven't already.
2. **Upload Data**: Select your `Data_For_AI.xlsx` file. You can watch the record count climb in real-time.
3. **Analyze**: Ask plain-English questions like:
   - *"How many members exceeded $20K in the last 12 months?"*
   - *"Who are the top 20 members by allowed amount YTD?"*
   - *"Show a monthly summary of allowed vs paid for last year."*
   - *"Which 10 principal diagnosis descriptions have the highest average billed amount?"*
   - *"Break down the total paid amount and total member liability (copay + deductible) by facility for 2024."*
   - *"Which members have more than 50 claims recorded in 2025?"*
   - *"List the top 5 CPT procedure categories by the volume of claims processed."*
   - *"What is the total insurance discount amount (billed minus allowed) across all employer groups?"*
   - *"What is the average insurance discount (billed minus allowed) per member for the top 100 members?"*
   - *"How many distinct members had a 'PROFESSIONAL' service in Dec 2025?"*

4. **Export**: Use the **Export All Session Queries** button to download a professional multi-sheet Excel workbook.

## ⚠️ Notes
- **Service Role Key**: The `SUPABASE_SERVICE_ROLE_KEY` is required for the "One-Click Sync" button to work, as it needs administrative permissions to create/reset tables.
- **Model Switching**: If you run into quota limits with one provider, use the dropdown in the dashboard to switch between Groq, Gemini, and OpenAI.
