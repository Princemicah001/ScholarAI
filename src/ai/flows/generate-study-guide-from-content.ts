'use server';
/**
 * @fileOverview Generates a comprehensive study guide from a block of text.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const GenerateStudyGuideInputSchema = z.object({
  content: z.string().describe('The source text to generate the study guide from.'),
});

export const GenerateStudyGuideOutputSchema = z.object({
  summary: z.string().describe('An executive summary of the content.'),
  keyPoints: z.array(z.string()).describe('A list of the most important key points or takeaways.'),
  definitions: z.array(z.object({
    term: z.string(),
    definition: z.string(),
  })).describe('A list of key terms and their definitions.'),
  concepts: z.array(z.object({
    concept: z.string(),
    explanation: z.string(),
  })).describe('A list of important concepts with detailed explanations.'),
  examples: z.array(z.object({
    concept: z.string(),
    example: z.string(),
  })).describe('Mini examples to illustrate key concepts.'),
  mnemonics: z.array(z.string()).describe('Quick memorization cues or mnemonics to help with recall.'),
});


export type GenerateStudyGuideInput = z.infer<typeof GenerateStudyGuideInputSchema>;
export type GenerateStudyGuideOutput = z.infer<typeof GenerateStudyGuideOutputSchema>;

export async function generateStudyGuideFromContent(input: GenerateStudyGuideInput): Promise<GenerateStudyGuideOutput> {
  const studyGuidePrompt = ai.definePrompt({
    name: 'studyGuidePrompt',
    input: { schema: GenerateStudyGuideInputSchema },
    output: { schema: GenerateStudyGuideOutputSchema },
    prompt: `You are an expert educator and study coach. Your task is to create a comprehensive study guide from the provided text.

  Analyze the following content and generate:
  1.  **Executive Summary**: A brief overview of the entire text.
  2.  **Key Points**: A bulleted list of the most critical information.
  3.  **Definitions**: A list of important terms and their clear, concise definitions.
  4.  **Explained Concepts**: A breakdown of the main ideas with detailed explanations.
  5.  **Examples**: Simple examples to clarify complex topics.
  6.  **Memorization Cues**: Mnemonics or other memory aids to help the learner remember key information.

  Ensure the output is structured, clear, and optimized for learning and retention.

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
