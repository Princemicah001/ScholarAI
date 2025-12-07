
'use server';

/**
 * @fileOverview Extracts text content from a file using OCR.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractContentFromFileInputSchema = z.object({
    fileDataUri: z.string().describe("A file (image, PDF, etc.) as a data URI."),
});

const ExtractContentFromFileOutputSchema = z.object({
    content: z.string().describe('The extracted text content from the file.'),
});

type ExtractContentFromFileInput = z.infer<typeof ExtractContentFromFileInputSchema>;
type ExtractContentFromFileOutput = z.infer<typeof ExtractContentFromFileOutputSchema>;

const ocrPrompt = ai.definePrompt({
    name: 'ocrPrompt',
    input: { schema: ExtractContentFromFileInputSchema },
    output: { schema: ExtractContentFromFileOutputSchema },
    prompt: `You are an Optical Character Recognition (OCR) specialist. Your task is to extract all text from the provided file.

    File: {{media url=fileDataUri}}

    Return only the full, extracted text content.
    `,
});

export async function extractContentFromFile(input: ExtractContentFromFileInput): Promise<ExtractContentFromFileOutput> {
    const { output } = await ocrPrompt(input);
    if (!output) {
        throw new Error('Failed to extract content from file.');
    }
    return output;
}
