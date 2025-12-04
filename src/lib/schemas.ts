import { z } from 'zod';

// Schemas for form validation on SERVER ACTIONS.
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
export const GenerateStudyGuideFromContentInputSchema = z.object({
  content: z.string().min(1, { message: 'Content cannot be empty.' }),
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


// Define the structure for a single question
export const QuestionSchema = z.object({
  questionText: z.string().describe('The full text of the question.'),
  questionType: z.enum(['multiple_choice', 'true_false', 'short_answer', 'essay']).describe('The type of the question.'),
  options: z.array(z.string()).optional().describe('A list of possible answers for multiple-choice questions.'),
  correctAnswer: z.string().describe('The correct answer. For true/false, it should be "True" or "False".'),
  explanation: z.string().describe('A brief explanation of why the answer is correct.'),
});
export type Question = z.infer<typeof QuestionSchema>;

// Define the schema for the entire assessment
export const AIAssessmentSchema = z.object({
  questions: z.array(QuestionSchema).describe('A list of generated assessment questions.'),
});

// Define the input schema for the assessment generation flow
export const GenerateAIAssessmentInputSchema = z.object({
  content: z.string().describe('The source text to generate the assessment from.'),
  questionCount: z.number().min(1).max(20).describe('The number of questions to generate.'),
  questionTypes: z.array(z.enum(['multiple_choice', 'true_false', 'short_answer', 'essay'])).min(1).describe('The types of questions to generate.'),
});

export type AIAssessment = z.infer<typeof AIAssessmentSchema>;
export type GenerateAIAssessmentInput = z.infer<typeof GenerateAIAssessmentInputSchema>;
