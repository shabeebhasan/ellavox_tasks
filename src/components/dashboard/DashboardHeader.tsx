import React from 'react';
import { Database, Loader2 } from 'lucide-react';
import { DbInfo } from '@/types/claims';

interface Props {
    dbInfo: DbInfo | null;
    isSyncing: boolean;
    onSync: () => void;
}

export function DashboardHeader({ dbInfo, isSyncing, onSync }: Props) {
    return (
        <header className="border-b pb-4 mb-4">
            <h1 className="text-3xl font-bold flex items-center gap-2 text-indigo-700">
                <Database className="w-8 h-8" />
                Claims Natural Language Analyst
            </h1>
            <p className="text-gray-500 mt-2">Upload claims data and ask questions in plain English.</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
                {dbInfo !== null && (
                    <>
                        <div className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100 shadow-sm">
                            {dbInfo.count.toLocaleString()} Records
                        </div>
                        <div className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100 shadow-sm">
                            {dbInfo.distinctMembers.toLocaleString()} Members
                        </div>
                        {dbInfo.minDate && (
                            <div className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-100 shadow-sm">
                                Range: {dbInfo.minDate} to {dbInfo.maxDate}
                            </div>
                        )}
                    </>
                )}
                <button
                    onClick={onSync}
                    disabled={isSyncing}
                    className="text-[10px] uppercase tracking-wider font-bold text-gray-400 hover:text-indigo-600 border border-gray-200 px-2 py-1 rounded hover:border-indigo-200 transition-all flex items-center gap-1 bg-white"
                >
                    {isSyncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
                    Sync DB Structure
                </button>
            </div>
        </header>
    );
}
