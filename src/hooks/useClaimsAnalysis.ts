import { useState, useEffect } from 'react';
import * as ExcelJS from 'exceljs';
import { DbInfo, QueryHistoryItem, UploadStatus, QueryStatus, AIModel } from '@/types/claims';

export function useClaimsAnalysis() {
    // Database Stats
    const [dbInfo, setDbInfo] = useState<DbInfo | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    // Upload State
    const [file, setFile] = useState<File | null>(null);
    const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
    const [uploadMsg, setUploadMsg] = useState('');

    // Query State
    const [question, setQuestion] = useState('');
    const [model, setModel] = useState<AIModel>('groq');
    const [queryStatus, setQueryStatus] = useState<QueryStatus>('idle');
    const [results, setResults] = useState<any[]>([]);
    const [generatedSql, setGeneratedSql] = useState('');
    const [explanation, setExplanation] = useState('');
    const [queryError, setQueryError] = useState('');

    // History
    const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);

    const fetchDbCount = async () => {
        try {
            const res = await fetch('/api/info');
            const data = await res.json();
            if (res.ok && data.count !== undefined) {
                setDbInfo(data);
            }
        } catch (e) {
            console.error('Failed to fetch db info', e);
        }
    };

    useEffect(() => {
        fetchDbCount();
        const enablePolling = process.env.NEXT_PUBLIC_ENABLE_POLLING === 'true';

        let interval: NodeJS.Timeout | undefined;
        if (enablePolling && uploadStatus === 'uploading') {
            interval = setInterval(fetchDbCount, 3000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [uploadStatus]);

    const handleSyncDatabase = async () => {
        if (!confirm('This will RESET the database and wipe all existing data. Continue?')) return;
        setIsSyncing(true);
        try {
            const res = await fetch('/api/setup', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                alert('Database synchronized successfully!');
                fetchDbCount();
            } else {
                alert('Sync failed: ' + data.error);
            }
        } catch (e) {
            alert('Sync failed.');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploadStatus('uploading');
        setUploadMsg('Uploading and processing...');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Upload failed');

            setUploadStatus('success');
            setUploadMsg(`Successfully uploaded ${data.count} records.`);
            fetchDbCount();
        } catch (err: any) {
            setUploadStatus('error');
            setUploadMsg(err.message);
        }
    };

    const handleQuery = async () => {
        if (!question.trim()) return;

        setQueryStatus('loading');
        setResults([]);
        setGeneratedSql('');
        setExplanation('');
        setQueryError('');

        try {
            const res = await fetch('/api/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question, model }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Query failed');

            setResults(data.data);
            setGeneratedSql(data.sql);
            setExplanation(data.explanation);
            setQueryStatus('success');

            if (data.data && data.data.length > 0) {
                setQueryHistory(prev => [
                    {
                        question,
                        results: data.data,
                        sql: data.sql,
                        explanation: data.explanation,
                        timestamp: new Date().toLocaleTimeString()
                    },
                    ...prev
                ]);
            }
        } catch (err: any) {
            setQueryStatus('error');
            setQueryError(err.message);
            if (err.sql) setGeneratedSql(err.sql);
        }
    };

    const handleExport = async () => {
        if (queryHistory.length === 0) return;

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Ellavox Claims Analyst';
        workbook.lastModifiedBy = 'Ellavox Claims Analyst';
        workbook.created = new Date();

        queryHistory.forEach((item, index) => {
            const sheetName = `${index + 1}_${item.question.slice(0, 20)}`.replace(/[\*\?\/\\\[\]]/g, '');
            const sheet = workbook.addWorksheet(sheetName.substring(0, 31));

            sheet.addRow(['Question:', item.question]).font = { bold: true, size: 12 };
            sheet.addRow(['Explanation:', item.explanation]).font = { color: { argb: 'FF4F46E5' } };
            sheet.addRow(['Executed at:', item.timestamp]);
            sheet.addRow(['SQL generated:', item.sql]).font = { italic: true, color: { argb: 'FF808080' } };
            sheet.addRow([]);

            if (item.results.length > 0) {
                const head = Object.keys(item.results[0]);
                const headerRow = sheet.addRow(head);
                headerRow.eachCell((cell) => {
                    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
                });

                item.results.forEach(row => {
                    sheet.addRow(Object.values(row));
                });

                sheet.columns.forEach(col => { col.width = 25; });
            }
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `claims_analysis_report_${new Date().toISOString().split('T')[0]}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return {
        // Stats
        dbInfo,
        isSyncing,
        handleSyncDatabase,
        // Upload
        file,
        setFile,
        uploadStatus,
        uploadMsg,
        handleUpload,
        // Query
        question,
        setQuestion,
        model,
        setModel,
        queryStatus,
        results,
        generatedSql,
        explanation,
        queryError,
        handleQuery,
        // History/Export
        queryHistory,
        handleExport
    };
}
