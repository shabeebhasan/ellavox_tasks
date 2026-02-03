import { NextRequest, NextResponse } from 'next/server';
import { supabase, adminSupabase } from '@/lib/supabase';
import { openai } from '@/lib/openai';
import { geminiModel } from '@/lib/gemini';
import { groq, GROQ_MODEL } from '@/lib/groq';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { question, model = 'groq' } = await req.json();

        if (!question) {
            return NextResponse.json({ error: 'Question is required' }, { status: 400 });
        }

        // 1. Generate SQL
        const systemPrompt = `
      You are an expert Postgres SQL analyst for medical claims.
      Table "claims" has these columns:
      - carrier, group_name, benefit_package (text): Demographics
      - claim_number, subscriber_id, member_id, member_custom_id (text): Identifiers
      - incurred_date, paid_date (date): Dates
      - billed_amount, allowed_amount, paid_amount, member_paid_amount (numeric): Primary Financials
      - cob_amount, coinsurance_amount, copayment_amount, covered_amount, deductible_amount, discount_amount, not_covered_amount (numeric): Detailed Financials
      - diag_code_principal, diag_desc_principal (text): Principal Diagnosis
      - dx1_code, dx1_desc, dx2_code, dx2_desc, dx3_code, dx3_desc (text): Secondary Diagnoses
      - cpt_code, cpt_category, cpt_description (text): Procedure Details
      - icd_proc_code_1, icd_proc_desc_1, icd_proc_code_2, icd_proc_desc_2 (text): ICD Procedures
      - drg_code, drg_description (text): MS-DRG details
      - service_category, facility (text): Provider context

      Your task:
      1. Generate a SINGLE SQL query (standard Postgres).
      2. Use range comparisons for dates (incurred_date >= '2024-01-01').
      3. **PRIVACY & AGGREGATION**: Default to aggregate-level outputs (counts, sums) unless member detail is specifically asked for. 
      4. **EXPLANATION**: Provide a 1-sentence explanation of what data is being queried.

      **OUTPUT FORMAT**: Return ONLY a JSON object:
      {
        "sql": "SELECT ...",
        "explanation": "..."
      }
    `;

        let llmResponse = '';
        if (model === 'gemini') {
            const prompt = `${systemPrompt} \n\nUser Question: ${question}`;
            const result = await geminiModel.generateContent(prompt);
            llmResponse = result.response.text();
        } else if (model === 'groq') {
            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: question },
                ],
                model: GROQ_MODEL,
            });
            llmResponse = chatCompletion.choices[0].message.content || '';
        } else {
            const chatCompletion = await openai.chat.completions.create({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: question },
                ],
                model: 'gpt-4o',
            });
            llmResponse = chatCompletion.choices[0].message.content || '';
        }

        console.log('--- NL QUERY ---');
        console.log('Question:', question);
        console.log('Model:', model);
        console.log('Raw LLM Response:', llmResponse);

        let sql = '';
        let explanation = '';

        // Try to parse JSON
        try {
            // Find JSON block if it exists
            const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
            const jsonData = JSON.parse(jsonMatch ? jsonMatch[0] : llmResponse);
            sql = jsonData.sql;
            explanation = jsonData.explanation;
        } catch (e) {
            // Fallback for raw SQL
            sql = llmResponse;
            explanation = 'Generated based on your question.';

            // Cleanup: Remove markdown blocks if present
            if (sql.includes('```')) {
                const match = sql.match(/```(?:sql)?\s*([\s\S]*?)```/i);
                if (match) sql = match[1];
            }
        }

        // Final SQL cleanup
        const sqlKeywords = ['SELECT', 'WITH', 'INSERT', 'UPDATE', 'DELETE'];
        let firstKeywordIndex = -1;
        for (const kw of sqlKeywords) {
            const idx = sql.toUpperCase().indexOf(kw);
            if (idx !== -1 && (firstKeywordIndex === -1 || idx < firstKeywordIndex)) {
                firstKeywordIndex = idx;
            }
        }
        if (firstKeywordIndex !== -1) {
            sql = sql.substring(firstKeywordIndex);
        }
        sql = sql.split(';')[0].trim();

        console.log('Final SQL:', sql);

        if (!sql) {
            return NextResponse.json({ error: 'LLM failed to generate a valid SQL query.' }, { status: 500 });
        }

        // 2. Execute SQL via RPC
        const client = adminSupabase || supabase;
        const { data, error } = await client.rpc('exec_sql', { query: sql });

        if (error) {
            console.error('SQL Execution Error:', error);
            return NextResponse.json({
                error: error.message,
                sql: sql
            }, { status: 500 });
        }

        return NextResponse.json({
            sql,
            explanation,
            data: data || [],
            question
        });

    } catch (error: any) {
        console.error('Query handler error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
