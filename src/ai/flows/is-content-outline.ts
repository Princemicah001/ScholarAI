
'use server';
/**
 * @fileOverview Determines if a block of text is a course outline.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const IsContentOutlineInputSchema = z.object({
  content: z.string().describe('The text content to analyze.'),
});

const IsContentOutlineOutputSchema = z.object({
  isOutline: z.boolean().describe('True if the content is determined to be a course outline, syllabus, or similar structured document.'),
});

type IsContentOutlineInput = z.infer<typeof IsContentOutlineInputSchema>;
type IsContentOutlineOutput = z.infer<typeof IsContentOutlineOutputSchema>;

const outlineCheckPrompt = ai.definePrompt({
    name: 'outlineCheckPrompt',
    input: { schema: IsContentOutlineInputSchema },
    output: { schema: IsContentOutlineOutputSchema },
    prompt: `You are an expert document analyzer. Your task is to determine if the following text is a course outline, syllabus, table of contents, or a similarly structured document that lists topics for study.

Analyze the structure, headings, and keywords. A course outline typically has a hierarchical structure (e.g., chapters, sections, bullet points) and uses terms like "Module", "Week", "Unit", "Chapter", "Introduction", "Conclusion", etc.

Respond with ONLY true or false for the 'isOutline' field based on your analysis.

Content to Analyze:
---
{{{content}}}
---
`,
  });

export async function isContentOutline(input: IsContentOutlineInput): Promise<IsContentOutlineOutput> {
  const { output } = await outlineCheckPrompt(input);
  if (!output) {
    // Default to false if the AI fails to respond.
    return { isOutline: false };
  }
  return output;
}
