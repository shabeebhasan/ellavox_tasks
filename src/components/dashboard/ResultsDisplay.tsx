import React from 'react';
import { Database, Download } from 'lucide-react';

interface Props {
    results: any[];
    explanation: string;
    generatedSql: string;
    historyCount: number;
    onExport: () => void;
}

export function ResultsDisplay({ results, explanation, generatedSql, historyCount, onExport }: Props) {
    return (
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-slate-800">
                    <Database className="w-5 h-5 text-indigo-500" />
                    Results ({results.length})
                </h2>
                {historyCount > 0 && (
                    <button
                        onClick={onExport}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm shadow-sm transition-all"
                    >
                        <Download className="w-4 h-4" />
                        Export All Session Queries ({historyCount})
                    </button>
                )}
            </div>

            {explanation && (
                <div className="mb-4 p-4 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-800 italic animate-in fade-in slide-in-from-top-2">
                    <strong>Calculation Logic:</strong> {explanation}
                </div>
            )}

            <details className="mb-4 text-xs text-gray-500 group">
                <summary className="cursor-pointer hover:text-gray-700 list-none flex items-center gap-1">
                    <span className="group-open:rotate-90 transition-transform">▶</span>
                    View Generated SQL
                </summary>
                <div className="mt-2 p-3 bg-gray-900 text-green-400 font-mono rounded-lg overflow-auto max-h-40 border border-gray-800 shadow-inner">
                    {generatedSql}
                </div>
            </details>

            {results.length > 0 ? (
                <div className="overflow-auto max-h-96 border rounded-lg shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            {results[0] && (
                                <tr>
                                    {Object.keys(results[0]).map((key) => (
                                        <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50 z-10 border-b">
                                            {key}
                                        </th>
                                    ))}
                                </tr>
                            )}
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {results.map((row, idx) => (
                                <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                                    {Object.values(row).map((val: any, i) => (
                                        <td key={i} className="px-6 py-4 whitespace-nowrap text-slate-600 border-r last:border-r-0">
                                            {typeof val === 'object' ? JSON.stringify(val).slice(0, 50) + '...' : String(val)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="p-12 text-center text-gray-400 border-2 border-dashed rounded-lg bg-gray-50">
                    No records matched your query. Try adjusting your question.
                </div>
            )}
        </section>
    );
}
