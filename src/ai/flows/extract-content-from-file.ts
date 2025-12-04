'use server';

/**
 * @fileOverview Extracts text content from a file using OCR.
 *
 * - extractContentFromFile - A function to extract text from a file.
 * - ExtractContentFromFileInput - The input type for the extractContentFromFile function.
 * - ExtractContentFromFileOutput - The return type for the extractContentFromFile function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractContentFromFileInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "The file content as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractContentFromFileInput = z.infer<typeof ExtractContentFromFileInputSchema>;

const ExtractContentFromFileOutputSchema = z.object({
  extractedText: z.string().describe('The extracted text content from the file.'),
});
export type ExtractContentFromFileOutput = z.infer<typeof ExtractContentFromFileOutputSchema>;

export async function extractContentFromFile(
  input: ExtractContentFromFileInput
): Promise<ExtractContentFromFileOutput> {
  return extractContentFromFileFlow(input);
}

const extractContentPrompt = ai.definePrompt({
  name: 'extractContentFromFilePrompt',
  input: {schema: ExtractContentFromFileInputSchema},
  output: {schema: ExtractContentFromFileOutputSchema},
  prompt: `You are an Optical Character Recognition (OCR) expert. Extract all text content from the provided file.
  
File: {{media url=fileDataUri}}`,
});

const extractContentFromFileFlow = ai.defineFlow(
  {
    name: 'extractContentFromFileFlow',
    inputSchema: ExtractContentFromFileInputSchema,
    outputSchema: ExtractContentFromFileOutputSchema,
  },
  async input => {
    try {
      const {output} = await extractContentPrompt(input);
      if (!output) {
        throw new Error('Failed to extract content from the file.');
      }
      return output;
    } catch (error: any) {
      console.error('Error extracting content from file:', error);
      throw new Error(`Failed to extract content from file: ${error.message}`);
    }
  }
);
