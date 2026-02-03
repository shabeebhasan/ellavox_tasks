import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
    console.warn('OpenAI API Key is missing. Check .env.local');
}

export const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // Just in case used on client, but better on server
});
