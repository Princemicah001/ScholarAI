'use server';
/**
 * @fileOverview Generates a comprehensive study guide from a block of text.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { GenerateStudyGuideOutputSchema } from '@/lib/schemas';

const GenerateStudyGuideInputSchema = z.object({
  content: z.string().describe('The source text to generate the study guide from.'),
});

type GenerateStudyGuideInput = z.infer<typeof GenerateStudyGuideInputSchema>;
type GenerateStudyGuideOutput = z.infer<typeof GenerateStudyGuideOutputSchema>;


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
