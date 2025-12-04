import { config } from 'dotenv';
config();

import '@/ai/flows/generate-ai-assessment.ts';
import '@/ai/flows/generate-study-guide-from-content.ts';
import '@/ai/flows/extract-content-from-url.ts';
import '@/ai/flows/extract-content-from-file.ts';
