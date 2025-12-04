'use server';
/**
 * @fileOverview Generates a study guide from uploaded content.
 *
 * - generateStudyGuideFromContent - A function that handles the study guide generation process.
 * - GenerateStudyGuideInput - The input type for the generateStudyGuideFromContent function.
 * - GenerateStudyGuideOutput - The return type for the generateStudyGuideFromContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateStudyGuideInputSchema = z.object({
  content: z.string().describe('The content to generate a study guide from.'),
});
export type GenerateStudyGuideInput = z.infer<typeof GenerateStudyGuideInputSchema>;

const GenerateStudyGuideOutputSchema = z.object({
  studyGuide: z.string().describe('The generated study guide.'),
});
export type GenerateStudyGuideOutput = z.infer<typeof GenerateStudyGuideOutputSchema>;

export async function generateStudyGuideFromContent(input: GenerateStudyGuideInput): Promise<GenerateStudyGuideOutput> {
  return generateStudyGuideFromContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStudyGuidePrompt',
  input: {schema: GenerateStudyGuideInputSchema},
  output: {schema: GenerateStudyGuideOutputSchema},
  prompt: `You are an expert study guide creator. Please create a concise study guide summarizing the key concepts and providing clear explanations from the following content:\n\nContent: {{{content}}}`,
});

const generateStudyGuideFromContentFlow = ai.defineFlow(
  {
    name: 'generateStudyGuideFromContentFlow',
    inputSchema: GenerateStudyGuideInputSchema,
    outputSchema: GenerateStudyGuideOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {
      studyGuide: output!.studyGuide,
    };
  }
);
