
'use server';
/**
 * @fileOverview Generates a comprehensive study guide from a block of text.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { GenerateStudyGuideOutputSchema } from '@/lib/schemas';

const GenerateStudyGuideInputSchema = z.object({
  content: z.string().describe('The source text to generate the study guide from.'),
  useOnlineSources: z.boolean().describe('Whether to use external online sources to enrich the guide.'),
});

type GenerateStudyGuideInput = z.infer<typeof GenerateStudyGuideInputSchema>;
type GenerateStudyGuideOutput = z.infer<typeof GenerateStudyGuideOutputSchema>;


export async function generateStudyGuideFromContent(input: GenerateStudyGuideInput): Promise<GenerateStudyGuideOutput> {
  const studyGuidePrompt = ai.definePrompt({
    name: 'studyGuidePrompt',
    input: { schema: GenerateStudyGuideInputSchema },
    output: { schema: GenerateStudyGuideOutputSchema },
    prompt: `You are an expert educator and study coach with a talent for making complex topics understandable and memorable. Your task is to create a comprehensive, well-structured study guide from the provided text, formatted in clear markdown.

  **Instructions:**
  1.  **Executive Summary**: Write a concise overview of the entire text.
  2.  **Key Points**: Create a bulleted list of the most critical, must-know information.
  3.  **Definitions**: Identify important terms and provide clear, simple definitions.
  4.  **Explained Concepts**: Break down the main ideas with detailed but easy-to-understand explanations.
  5.  **Examples**: Provide simple, relatable examples to clarify complex topics.
  6.  **Memorization Cues**: Create clever and effective memorization aids (mnemonics, acronyms, or vivid associations) for key information. Make them genuinely helpful and memorable.
  
  {{#if useOnlineSources}}
  7.  **Enrichment**: You are permitted and encouraged to use your own knowledge and access reliable, trustworthy online sources to add relevant details, context, or examples that are not present in the original text but would enhance a student's understanding.
  {{/if}}

  Ensure the entire output is well-organized, uses markdown for formatting (like **bolding** and lists), and is optimized for learning and retention.

  Provided Content:
  ---
  {{{content}}}
  ---
  `,
  });

  const { output } = await studyGuidePrompt(input);
  if (!output) {
    throw new Error('Failed to generate study guide.');
  }
  return output;
}
