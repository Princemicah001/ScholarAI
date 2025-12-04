import { z } from 'zod';

// Schemas for form validation on SERVER ACTIONS.
// These are distinct from any client-side form validation.
export const textSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters.' }),
  content: z.string().min(50, { message: 'Text content must be at least 50 characters.' }),
});

export const urlSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters.' }),
  url: z.string().url({ message: 'Please enter a valid URL.' }),
});

export const fileSchema = z.object({
  file: z.instanceof(File).refine((file) => file.size > 0, 'Please upload a file.'),
});

// Schema for AI flow inputs
export const GenerateStudyGuideInputSchema = z.object({
  materialId: z.string(),
  userId: z.string(),
});

// Schema for AI flow outputs
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
export type GenerateStudyGuideOutput = z.infer<typeof GenerateStudyGuideOutputSchema>;
