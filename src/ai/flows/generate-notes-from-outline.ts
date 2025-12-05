'use server';
/**
 * @fileOverview Generates comprehensive notes from a course outline.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateNotesFromOutlineInputSchema = z.object({
  outlineContent: z.string().describe('The text content of the course outline.'),
});

const GenerateNotesFromOutlineOutputSchema = z.object({
  notes: z.string().describe('The comprehensive, well-structured notes generated from the outline.'),
});

type GenerateNotesFromOutlineInput = z.infer<typeof GenerateNotesFromOutlineInputSchema>;
type GenerateNotesFromOutlineOutput = z.infer<typeof GenerateNotesFromOutlineOutputSchema>;

export async function generateNotesFromOutline(input: GenerateNotesFromOutlineInput): Promise<GenerateNotesFromOutlineOutput> {
  const notesPrompt = ai.definePrompt({
    name: 'notesFromOutlinePrompt',
    input: { schema: GenerateNotesFromOutlineInputSchema },
    output: { schema: GenerateNotesFromOutlineOutputSchema },
    prompt: `You are an expert educator and subject matter expert. Your task is to expand a course outline into a comprehensive set of study notes.

Analyze the following course outline. For each main topic and sub-topic, generate detailed notes, explanations, definitions, and examples. The final output should be a single, well-structured document formatted in plain text or simple markdown that is ready for a student to study from.

Course Outline:
---
{{{outlineContent}}}
---
`,
  });

  const { output } = await notesPrompt(input);
  if (!output) {
    throw new Error('Failed to generate notes from the outline.');
  }
  return output;
}
