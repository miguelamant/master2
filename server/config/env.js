import 'dotenv/config';

function requireEnv(key) {
    if (!process.env[key]) throw new Error(`Missing env var: ${key}`);
    return process.env[key];
}

export const env = {
    PORT: process.env.PORT || 3007,
    SESSION_SECRET: process.env.SESSION_SECRET || 'dev-secret',
    SUPABASE_URL: requireEnv('SUPABASE_URL'),
    SUPABASE_SERVICE_KEY: requireEnv('SUPABASE_SERVICE_KEY'),
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
    GMAIL_USER: process.env.GMAIL_USER || "",
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD || "",
};
