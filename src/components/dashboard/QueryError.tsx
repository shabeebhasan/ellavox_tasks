import React from 'react';
import { Info } from 'lucide-react';

interface Props {
    error: string;
    sql?: string;
}

export function QueryError({ error, sql }: Props) {
    return (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex gap-2 border border-red-100 animate-in shake-in duration-300">
            <Info className="w-5 h-5 flex-shrink-0" />
            <div>
                <p className="font-bold">Error executing query</p>
                <p className="text-sm opacity-90">{error}</p>
                {sql && (
                    <div className="mt-2 text-xs font-mono bg-red-100 p-2 rounded border border-red-200 shadow-inner">
                        <span className="font-bold uppercase block mb-1 opacity-50 text-[10px]">Failed SQL:</span>
                        {sql}
                    </div>
                )}
            </div>
        </div>
    );
}
