'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating AI assessments from study materials.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define the structure for a single question
const QuestionSchema = z.object({
  questionText: z.string().describe('The full text of the question.'),
  questionType: z.enum(['multiple_choice', 'true_false', 'short_answer']).describe('The type of the question.'),
  options: z.array(z.string()).optional().describe('A list of possible answers for multiple-choice questions.'),
  correctAnswer: z.string().describe('The correct answer. For true/false, it should be "True" or "False".'),
  explanation: z.string().describe('A brief explanation of why the answer is correct.'),
});

// Define the schema for the entire assessment
export const AIAssessmentSchema = z.object({
  questions: z.array(QuestionSchema).describe('A list of generated assessment questions.'),
});

// Define the input schema for the assessment generation flow
export const GenerateAIAssessmentInputSchema = z.object({
  content: z.string().describe('The source text to generate the assessment from.'),
  questionCount: z.number().min(1).max(20).describe('The number of questions to generate.'),
  questionTypes: z.array(z.enum(['multiple_choice', 'true_false', 'short_answer'])).describe('The types of questions to generate.'),
});

export type AIAssessment = z.infer<typeof AIAssessmentSchema>;
export type GenerateAIAssessmentInput = z.infer<typeof GenerateAIAssessmentInputSchema>;

export async function generateAIAssessment(input: GenerateAIAssessmentInput): Promise<AIAssessment> {
  const assessmentPrompt = ai.definePrompt({
    name: 'assessmentPrompt',
    input: { schema: GenerateAIAssessmentInputSchema },
    output: { schema: AIAssessmentSchema },
    prompt: `You are an expert test creator for an educational platform. Your task is to generate a set of assessment questions based on the provided study material.

  **Instructions:**
  1.  Generate exactly {{{questionCount}}} questions.
  2.  The questions should cover a variety of topics from the provided content.
  3.  The types of questions should be from the following list: {{{questionTypes}}}.
  4.  For multiple-choice questions, provide 4 options, where one is correct and the others are plausible distractors.
  5.  For all questions, provide a brief but clear explanation for the correct answer.

  **Study Material Content:**
  ---
  {{{content}}}
  ---
  `,
  });

  const { output } = await assessmentPrompt(input);
  if (!output) {
    throw new Error('Failed to generate AI assessment.');
  }
  return output;
}
