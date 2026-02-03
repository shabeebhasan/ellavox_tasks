import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import * as ExcelJS from 'exceljs';
import { Readable } from 'stream';

// Helper to normalize keys
const normalizeKey = (key: string) => {
    return key.trim().toLowerCase().replace(/[\s\W]+/g, '_');
};

// Helper to convert Excel serial date to JS Date or return valid date string
const formatDate = (value: any) => {
    if (!value) return null;

    // If it's already a Date object
    if (value instanceof Date) {
        return value.toISOString().split('T')[0];
    }

    // If it's a number (Excel serial date)
    if (typeof value === 'number' || !isNaN(Number(value))) {
        const serial = Number(value);
        const utc_days = Math.floor(serial - 25569);
        const utc_value = utc_days * 86400;
        const date_info = new Date(utc_value * 1000);
        // Basic check for valid date
        if (!isNaN(date_info.getTime())) {
            return date_info.toISOString().split('T')[0];
        }
    }

    // Fallback: try to treat as string and parse
    try {
        const d = new Date(value);
        if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    } catch (e) { }

    return null;
};

// Helper to sanitize numeric values
const formatNumeric = (value: any) => {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return isNaN(num) ? null : num;
};

export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    console.log('Upload API hit. Starting optimized process...');
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        console.log(`Processing file: ${file.name}, Size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`);

        // Use true streaming to avoid loading the whole file into RAM
        const webStream = file.stream() as any;
        const nodeStream = Readable.fromWeb(webStream);

        const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(nodeStream, {
            sharedStrings: 'cache',
            worksheets: 'emit',
        });

        let insertedCount = 0;
        let currentChunk: any[] = [];
        const CHUNK_SIZE = 500;

        // We'll track the header row
        let headers: string[] = [];

        for await (const worksheetReader of workbookReader) {
            // worksheetReader is an async iterator for rows
            for await (const row of worksheetReader) {
                // row.values returns [empty, col1, col2, ...] for 1-based indexing
                const values = row.values as any[];
                if (!values || values.length === 0) continue;

                if (row.number === 1) {
                    // Header row
                    headers = values.map(v => v ? String(v).trim() : '');
                    continue;
                }

                // Map row to object using the expanded schema
                const rowData: any = {};
                const mappedRow: any = {};

                headers.forEach((header, index) => {
                    if (!header) return;
                    const value = values[index];
                    const lowerKey = normalizeKey(header);
                    rowData[lowerKey] = value;

                    // Comprehensive Mapping Logic
                    const stringValue = (value !== null && value !== undefined && value !== '') ? String(value) : null;

                    if (lowerKey === 'carrier_b') mappedRow.carrier = stringValue;
                    if (lowerKey === 'groupname_b') mappedRow.group_name = stringValue;
                    if (lowerKey === 'claimnumber_b') mappedRow.claim_number = stringValue;
                    if (lowerKey === 'subscriberid_b') mappedRow.subscriber_id = stringValue;
                    if (lowerKey === 'memberid_b') mappedRow.member_id = stringValue;
                    if (lowerKey === 'member_custom_id_b') mappedRow.member_custom_id = stringValue;

                    if (lowerKey === 'incurreddate_b') mappedRow.incurred_date = formatDate(value);
                    if (lowerKey === 'paiddate_b') mappedRow.paid_date = formatDate(value);

                    if (lowerKey === 'billed_b') mappedRow.billed_amount = formatNumeric(value);
                    if (lowerKey === 'allowed_b') mappedRow.allowed_amount = formatNumeric(value);
                    if (lowerKey === 'paid_b') mappedRow.paid_amount = formatNumeric(value);
                    if (lowerKey === 'memberpaid_b') mappedRow.member_paid_amount = formatNumeric(value);

                    if (lowerKey === '3digitprincipaldiagnosiscode_b') mappedRow.diag_code_principal = stringValue;
                    if (lowerKey === '3digitprincipaldiagnosisdescription_b') mappedRow.diag_desc_principal = stringValue;

                    if (lowerKey === 'dx1code_b') mappedRow.dx1_code = stringValue;
                    if (lowerKey === 'dx1_b') mappedRow.dx1_desc = stringValue;
                    if (lowerKey === 'dx2code_b') mappedRow.dx2_code = stringValue;
                    if (lowerKey === 'dx2_b') mappedRow.dx2_desc = stringValue;
                    if (lowerKey === 'dx3code_b') mappedRow.dx3_code = stringValue;
                    if (lowerKey === 'dx3_b') mappedRow.dx3_desc = stringValue;

                    if (lowerKey === 'cptprocedurecode_b') mappedRow.cpt_code = stringValue;
                    if (lowerKey === 'cptprocedurecategory_b') mappedRow.cpt_category = stringValue;
                    if (lowerKey === 'cptproceduredescription_b') mappedRow.cpt_description = stringValue;

                    if (lowerKey === 'icdprocedurecode1_b') mappedRow.icd_proc_code_1 = stringValue;
                    if (lowerKey === 'icdproceduredescription1_b') mappedRow.icd_proc_desc_1 = stringValue;
                    if (lowerKey === 'icdprocedurecode2_b') mappedRow.icd_proc_code_2 = stringValue;
                    if (lowerKey === 'icdproceduredescription2_b') mappedRow.icd_proc_desc_2 = stringValue;

                    if (lowerKey === 'servicecategory_b') mappedRow.service_category = stringValue;
                    if (lowerKey === 'drgcode_b') mappedRow.drg_code = stringValue;
                    if (lowerKey === 'drgdescription_b') mappedRow.drg_description = stringValue;

                    if (lowerKey === 'cob_b') mappedRow.cob_amount = formatNumeric(value);
                    if (lowerKey === 'coinsurance_b') mappedRow.coinsurance_amount = formatNumeric(value);
                    if (lowerKey === 'copayment_b') mappedRow.copayment_amount = formatNumeric(value);
                    if (lowerKey === 'covered_b') mappedRow.covered_amount = formatNumeric(value);
                    if (lowerKey === 'deductible_b') mappedRow.deductible_amount = formatNumeric(value);
                    if (lowerKey === 'discount_b') mappedRow.discount_amount = formatNumeric(value);
                    if (lowerKey === 'notcovered_b') mappedRow.not_covered_amount = formatNumeric(value);

                    if (lowerKey === 'facility_b') mappedRow.facility = stringValue;
                    if (lowerKey === 'benefitpackage_b') mappedRow.benefit_package = stringValue;
                });

                mappedRow.raw_data = rowData;

                currentChunk.push(mappedRow);

                if (currentChunk.length >= CHUNK_SIZE) {
                    const { error } = await supabase.from('claims').insert(currentChunk);
                    if (error) throw error;
                    insertedCount += currentChunk.length;
                    console.log(`Inserted ${insertedCount} rows...`);
                    currentChunk = [];
                }
            }
        }

        // Final chunk
        if (currentChunk.length > 0) {
            const { error } = await supabase.from('claims').insert(currentChunk);
            if (error) throw error;
            insertedCount += currentChunk.length;
        }

        console.log(`Upload complete. Total rows inserted: ${insertedCount}`);
        return NextResponse.json({ success: true, count: insertedCount });

    } catch (error: any) {
        console.error('Upload handler error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
