import React from 'react';
import { Send, Loader2 } from 'lucide-react';
import { QueryStatus, AIModel } from '@/types/claims';

interface Props {
    question: string;
    model: AIModel;
    status: QueryStatus;
    setQuestion: (q: string) => void;
    setModel: (m: AIModel) => void;
    onQuery: () => void;
}

export function QueryInterface({ question, model, status, setQuestion, setModel, onQuery }: Props) {
    const examples = [
        { label: "Top 20 Members YTD", q: "Top 20 members by allowed amount YTD?" },
        { label: "Monthly Summary", q: "Monthly summary of allowed vs paid for last year?" },
        { label: "Frequent Claimants", q: "Which members have more than 50 claims in 2025?" },
        { label: "Avg Discount", q: "Average insurance discount per member for top 100?" }
    ];

    return (
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-500" />
                2. Query Interface
            </h2>
            <div className="flex gap-2">
                <select
                    value={model}
                    onChange={(e) => setModel(e.target.value as AIModel)}
                    className="p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                >
                    <option value="openai">OpenAI (GPT-4o)</option>
                    <option value="gemini">Gemini (2.0 Flash)</option>
                    <option value="groq">Groq (Llama 3.3)</option>
                </select>
                <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ex: Who are the top 5 members by allowed amount?"
                    className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && onQuery()}
                />
                <button
                    onClick={onQuery}
                    disabled={!question || status === 'loading'}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 shadow-sm transition-all"
                >
                    {status === 'loading' ? <Loader2 className="animate-spin w-4 h-4" /> : <Send className="w-4 h-4" />}
                    Ask
                </button>
            </div>

            <div className="mt-3 flex gap-2 text-sm text-gray-500 overflow-x-auto pb-2 scrollbar-hide">
                <span className="font-medium whitespace-nowrap">Try:</span>
                {examples.map((ex) => (
                    <button
                        key={ex.label}
                        onClick={() => setQuestion(ex.q)}
                        className="px-3 py-1 bg-gray-100 rounded-full hover:bg-gray-200 whitespace-nowrap transition-colors"
                    >
                        {ex.label}
                    </button>
                ))}
            </div>
        </section>
    );
}
