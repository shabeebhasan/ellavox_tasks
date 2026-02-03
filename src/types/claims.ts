export interface DbInfo {
    count: number;
    minDate: string | null;
    maxDate: string | null;
    distinctMembers: number;
}

export interface QueryHistoryItem {
    question: string;
    results: any[];
    sql: string;
    explanation: string;
    timestamp: string;
}

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';
export type QueryStatus = 'idle' | 'loading' | 'success' | 'error';
export type AIModel = 'openai' | 'gemini' | 'groq';
