
'use server';

/**
 * @fileOverview This file defines a Genkit flow for evaluating a user's answers to an AI-generated assessment.
 */

import { ai } from '@/ai/genkit';
import {
  EvaluateAIAssessmentInputSchema,
  AssessmentEvaluationOutputSchema,
  type EvaluateAIAssessmentInput,
  type AssessmentEvaluationOutput,
} from '@/lib/schemas';

const evaluationPrompt = ai.definePrompt({
  name: 'evaluationPrompt',
  input: { schema: EvaluateAIAssessmentInputSchema },
  output: { schema: AssessmentEvaluationOutputSchema },
  prompt: `You are an expert university examiner with unlimited knowledge. Your task is to evaluate a user's performance on an assessment based on the provided questions and their submitted answers. You are not limited to the provided study material and should use your full breadth of knowledge to provide accurate and comprehensive evaluations.

      **Instructions:**
      1.  Calculate an overall percentage score (0-100).
      2.  For each question, determine if the user's answer is correct by comparing it to the correct answer.
      3.  Provide clear, concise, and helpful feedback for each question:
          -   For **multiple-choice** questions, if the answer is wrong, explain why the correct answer is right. If correct, briefly affirm it.
          -   For **short answer** or **flashcard** questions, if the answer is incorrect or incomplete, provide the ideal, comprehensive answer.
          -   For **essay** questions, perform a detailed analysis:
              -   Provide overall feedback on the essay's structure, arguments, and accuracy.
              -   Break down the user's essay into text segments and classify each as 'green' (highly relevant and correct), 'orange' (partially correct or relevant but incomplete), or 'grey' (irrelevant or incorrect).
              -   List specific points of correction or improvement.
              -   Suggest 3 distinct alternative ways the essay could have been answered, providing a title for each approach and outlining the key marking points.
      4.  Provide a summary of the user's strengths and a constructive analysis of their weaknesses based on their overall performance.

      **Assessment Questions & User Answers:**
      ---
      {{#each assessment.questions}}
      **Question {{add @index 1}} ({{this.questionType}}):**
      - Question: {{this.questionText}}
      {{#if this.options}}
      - Options: {{join this.options ", "}}
      {{/if}}
      - Correct Answer: {{this.correctAnswer}}
      - User's Answer: {{(lookup ../userAnswers (lookup this "questionIndex"))}}
      ---
      {{/each}}
      `,
});

export async function evaluateAIAssessment(
  input: EvaluateAIAssessmentInput
): Promise<AssessmentEvaluationOutput> {
  const { assessment, userAnswers } = input;

  // Create a map of questionIndex to answer for easy lookup in the prompt
  const answerMap = userAnswers.reduce((acc, ans) => {
    acc[ans.questionIndex] = ans.answer || "Not Answered";
    return acc;
  }, {} as Record<number, string>);

  // Assign questionIndex to each question for the prompt to reference
  const questionsWithIndex = assessment.questions.map((q, index) => ({
    ...q,
    questionIndex: index,
  }));
  
  const promptInput = {
    assessment: {
      ...assessment,
      questions: questionsWithIndex,
    },
    userAnswers: answerMap,
  };

  const { output } = await evaluationPrompt(promptInput);
  if (!output) {
    throw new Error('Failed to evaluate AI assessment.');
  }
  return output;
}
