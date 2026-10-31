import { config } from 'zod';
// Keep the strict script policy: schema validation must not probe eval in the browser.
config({ jitless: true });
