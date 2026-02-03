import Groq from "groq-sdk";

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
    console.warn('Groq API Key is missing. Check .env.local');
}

export const groq = new Groq({
    apiKey: apiKey || "",
});

export const GROQ_MODEL = "llama-3.3-70b-versatile";
