export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
export const OPENROUTER_MODEL = "openrouter/owl-alpha";
export const MAX_FILE_SIZE = 100 * 1024; // 100KB
export const CHUNK_TOKEN_LIMIT = 60000;
export const CHARS_PER_TOKEN = 4; // rough estimate
export const REVIEW_POLL_INTERVAL = 2000;
export const DEFAULT_FILE_PATTERNS = "**/*.{ts,tsx,js,jsx,py,go,rs,java,rb,php,css,html,md}";
export const DEFAULT_IGNORE_PATTERNS = "node_modules/**,dist/**,build/**,.next/**,.git/**,*.lock,package-lock.json";
