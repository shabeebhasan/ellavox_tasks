'use client';

import React from 'react';
import { useClaimsAnalysis } from '@/hooks/useClaimsAnalysis';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { UploadSection } from './dashboard/UploadSection';
import { QueryInterface } from './dashboard/QueryInterface';
import { ResultsDisplay } from './dashboard/ResultsDisplay';
import { QueryError } from './dashboard/QueryError';

export default function Dashboard() {
    const {
        dbInfo,
        isSyncing,
        handleSyncDatabase,
        file,
        setFile,
        uploadStatus,
        uploadMsg,
        handleUpload,
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
        queryHistory,
        handleExport
    } = useClaimsAnalysis();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in duration-700">
            <DashboardHeader
                dbInfo={dbInfo}
                isSyncing={isSyncing}
                onSync={handleSyncDatabase}
            />

            <UploadSection
                file={file}
                status={uploadStatus}
                message={uploadMsg}
                onFileChange={handleFileChange}
                onUpload={handleUpload}
            />

            <QueryInterface
                question={question}
                model={model}
                status={queryStatus}
                setQuestion={setQuestion}
                setModel={setModel}
                onQuery={handleQuery}
            />

            {queryStatus === 'success' && (
                <ResultsDisplay
                    results={results}
                    explanation={explanation}
                    generatedSql={generatedSql}
                    historyCount={queryHistory.length}
                    onExport={handleExport}
                />
            )}

            {queryError && (
                <QueryError
                    error={queryError}
                    sql={generatedSql}
                />
            )}
        </div>
    );
}
