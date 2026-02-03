import React from 'react';
import { FileUp, Upload, Loader2 } from 'lucide-react';
import { UploadStatus } from '@/types/claims';

interface Props {
    file: File | null;
    status: UploadStatus;
    message: string;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onUpload: () => void;
}

export function UploadSection({ file, status, message, onFileChange, onUpload }: Props) {
    return (
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileUp className="w-5 h-5 text-indigo-500" />
                1. Data Ingestion
            </h2>
            <div className="flex items-center gap-4">
                <input
                    type="file"
                    accept=".xlsx"
                    onChange={onFileChange}
                    className="block w-full text-sm text-slate-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-indigo-50 file:text-indigo-700
            hover:file:bg-indigo-100"
                />
                <button
                    onClick={onUpload}
                    disabled={!file || status === 'uploading'}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                >
                    {status === 'uploading' ? <Loader2 className="animate-spin w-4 h-4" /> : <Upload className="w-4 h-4" />}
                    Upload
                </button>
            </div>
            {message && (
                <div className={`mt-4 p-3 rounded text-sm ${status === 'error' ? 'bg-red-50 text-red-700 border border-red-100' :
                        status === 'success' ? 'bg-green-50 text-green-700 border border-green-100' :
                            'bg-blue-50 text-blue-700 border border-blue-100'
                    }`}>
                    {message}
                </div>
            )}
        </section>
    );
}
