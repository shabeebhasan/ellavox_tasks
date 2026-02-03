import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        if (!adminSupabase) {
            return NextResponse.json({ error: 'Supabase admin client not initialized' }, { status: 500 });
        }

        // Parallel execution for better performance
        const [countRes, rangeRes, membersRes] = await Promise.all([
            adminSupabase.rpc('exec_sql', { query: 'SELECT COUNT(*) FROM claims' }),
            adminSupabase.rpc('exec_sql', { query: 'SELECT MIN(incurred_date), MAX(incurred_date) FROM claims' }),
            adminSupabase.rpc('exec_sql', { query: 'SELECT COUNT(DISTINCT member_id) FROM claims' })
        ]);

        if (countRes.error) throw countRes.error;
        if (rangeRes.error) throw rangeRes.error;
        if (membersRes.error) throw membersRes.error;

        const totalCount = countRes.data?.[0]?.count || 0;
        const minDate = rangeRes.data?.[0]?.min || null;
        const maxDate = rangeRes.data?.[0]?.max || null;
        const distinctMembers = membersRes.data?.[0]?.count || 0;

        return NextResponse.json({
            count: totalCount,
            minDate,
            maxDate,
            distinctMembers
        });
    } catch (error: any) {
        console.error('Info endpoint error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
