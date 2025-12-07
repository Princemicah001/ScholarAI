
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating AI assessments from study materials.
 */

import { ai } from '@/ai/genkit';
import { GenerateAIAssessmentInputSchema, AIAssessmentSchema, type GenerateAIAssessmentInput, type AIAssessment } from '@/lib/schemas';


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
  4.  For **multiple-choice** questions, provide 4 options, where one is correct and the others are plausible distractors.
  5.  For **flashcard** questions, the 'questionText' should be the term or concept, and the 'correctAnswer' should be the definition or explanation. Do not provide options.
  6.  For all questions, provide a brief but clear explanation for the correct answer.

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
