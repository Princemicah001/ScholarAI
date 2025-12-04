'use server';

/**
 * @fileOverview Extracts content from a given URL.
 *
 * - extractContentFromUrl - A function to extract content from a URL.
 * - ExtractContentFromUrlInput - The input type for the extractContentFromUrl function.
 * - ExtractContentFromUrlOutput - The return type for the extractContentFromUrl function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {extract} from '@extractus/article-extractor';

const ExtractContentFromUrlInputSchema = z.object({
  url: z.string().url().describe('The URL to extract content from.'),
});
export type ExtractContentFromUrlInput = z.infer<typeof ExtractContentFromUrlInputSchema>;

const ExtractContentFromUrlOutputSchema = z.object({
  title: z.string().describe('The title of the article.'),
  content: z.string().describe('The extracted content from the URL.'),
});
export type ExtractContentFromUrlOutput = z.infer<typeof ExtractContentFromUrlOutputSchema>;

export async function extractContentFromUrl(input: ExtractContentFromUrlInput): Promise<ExtractContentFromUrlOutput> {
  return extractContentFromUrlFlow(input);
}

const extractContentPrompt = ai.definePrompt({
  name: 'extractContentPrompt',
  input: {schema: ExtractContentFromUrlInputSchema},
  output: {schema: ExtractContentFromUrlOutputSchema},
  prompt: `Extract the main content and title from the following URL. Return the title and content.

URL: {{{url}}}`,
});

const extractContentFromUrlFlow = ai.defineFlow(
  {
    name: 'extractContentFromUrlFlow',
    inputSchema: ExtractContentFromUrlInputSchema,
    outputSchema: ExtractContentFromUrlOutputSchema,
  },
  async input => {
    try {
      const article = await extract(input.url);

      if (!article?.content || !article?.title) {
        throw new Error('Failed to extract content from the URL.');
      }

      return {
        title: article.title,
        content: article.content,
      };
    } catch (error: any) {
      console.error('Error extracting content:', error);
      throw new Error(`Failed to extract content from URL: ${error.message}`);
    }
  }
);
