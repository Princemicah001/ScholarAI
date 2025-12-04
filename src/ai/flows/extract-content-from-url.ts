'use server';

/**
 * @fileOverview Extracts and cleans textual content from a given URL.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { extract } from '@extractus/article-extractor';


const ExtractContentFromUrlInputSchema = z.object({
  url: z.string().url().describe('The URL to extract content from.'),
});

const ExtractContentFromUrlOutputSchema = z.object({
  content: z.string().describe('The main textual content extracted from the URL.'),
});

export type ExtractContentFromUrlInput = z.infer<typeof ExtractContentFromUrlInputSchema>;
export type ExtractContentFromUrlOutput = z.infer<typeof ExtractContentFromUrlOutputSchema>;


export async function extractContentFromUrl(input: ExtractContentFromUrlInput): Promise<ExtractContentFromUrlOutput> {
  const article = await extract(input.url);
  if (!article || !article.content) {
    throw new Error(`Failed to extract content from URL: ${input.url}`);
  }

  // A simple cleaning step - you could add more sophisticated cleaning here.
  const cleanedContent = article.content
    .replace(/<[^>]+>/g, ' ') // Remove HTML tags
    .replace(/\s\s+/g, ' ')   // Replace multiple spaces with a single space
    .trim();

  return { content: cleanedContent };
}
