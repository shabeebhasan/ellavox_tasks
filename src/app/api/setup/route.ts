import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!serviceRoleKey) {
            return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured.' }, { status: 500 });
        }

        // Initialize management client
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

        // Read schema.sql
        const schemaPath = path.join(process.cwd(), 'schema.sql');
        const sql = fs.readFileSync(schemaPath, 'utf8');

        // Split by semicolons and filter out empty statements, but preserve DO blocks
        // Simple splitting isn't great for PL/pgSQL, so we'll run it in larger chunks
        // Fortunately, Supabase rpc('exec_sql') can handle multiple statements if structured correctly,
        // BUT for a full schema with DROP/CREATE/DO, it's safer to use the internal Postgres management API.

        // We'll use the 'exec_sql' RPC if it's already there, or try to run the SQL in blocks.
        // Since we are using the service role, we can actually just run SQL.

        const { error } = await supabaseAdmin.rpc('exec_sql', { query: sql });

        if (error) {
            console.error('Setup Error:', error);
            // If exec_sql doesn't exist yet, we have a chicken-and-egg problem.
            // But the user has been running it manually, so it likely exists.
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ message: 'Database synchronized successfully.' });
    } catch (error: any) {
        console.error('Setup handler error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
