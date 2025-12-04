'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating AI assessments from study materials.
 *
 * The flow takes study materials as input and generates various types of assessment questions,
 * including multiple choice, flashcards, oral questions, and essay questions.
 *
 * @interface GenerateAIAssessmentInput - Defines the input schema for the generateAIAssessment function.
 * @interface GenerateAIAssessmentOutput - Defines the output schema for the generateAIAssessment function, including progress.
 * @function generateAIAssessment - The main function to trigger the assessment generation flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AssessmentTypeSchema = z.enum([
  'multiple_choice',
  'flashcard',
  'oral_question',
  'essay_question',
]);

const GenerateAIAssessmentInputSchema = z.object({
  studyMaterials: z.string().describe('The study materials to generate assessments from.'),
  assessmentTypes: z.array(AssessmentTypeSchema).describe('The types of assessments to generate.'),
  numberOfQuestions: z.number().min(1).max(100).default(10).describe('The number of questions to generate for each assessment type.'),
});

export type GenerateAIAssessmentInput = z.infer<typeof GenerateAIAssessmentInputSchema>;

const GeneratedQuestionSchema = z.object({
  type: AssessmentTypeSchema,
  question: z.string(),
  answer: z.string().optional(),
  options: z.array(z.string()).optional(),
});

const GenerateAIAssessmentOutputSchema = z.object({
  questions: z.array(GeneratedQuestionSchema).describe('The generated assessment questions.'),
  progress: z.string().describe('Progress summary of the assessment generation.'),
});

export type GenerateAIAssessmentOutput = z.infer<typeof GenerateAIAssessmentOutputSchema>;

export async function generateAIAssessment(input: GenerateAIAssessmentInput): Promise<GenerateAIAssessmentOutput> {
  return generateAIAssessmentFlow(input);
}

const generateAIAssessmentPrompt = ai.definePrompt({
  name: 'generateAIAssessmentPrompt',
  input: {
    schema: GenerateAIAssessmentInputSchema,
  },
  output: {
    schema: GenerateAIAssessmentOutputSchema,
  },
  prompt: `You are an AI assessment generator. You will generate assessment questions based on the study materials provided.

Study Materials: {{{studyMaterials}}}

Assessment Types: {{assessmentTypes}}

Number of Questions: {{numberOfQuestions}}

Generate a variety of questions based on the assessment types.

Output the questions in a JSON format.
`,
});

const generateAIAssessmentFlow = ai.defineFlow(
  {
    name: 'generateAIAssessmentFlow',
    inputSchema: GenerateAIAssessmentInputSchema,
    outputSchema: GenerateAIAssessmentOutputSchema,
  },
  async input => {
    const {output} = await generateAIAssessmentPrompt(input);
    // add progress message
    if (output) {
      output.progress = `Generated ${input.numberOfQuestions} assessment questions.`;
    }
    return output!;
  }
);
