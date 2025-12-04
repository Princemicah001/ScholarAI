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
  prompt: `You are an expert educator and exam grader. Your task is to evaluate a user's performance on an assessment based on the provided questions, their correct answers, and the user's submitted answers.

      **Instructions:**
      1.  Calculate an overall percentage score (0-100).
      2.  For each question, determine if the user's answer is correct.
      3.  Provide clear, concise, and helpful feedback for each question:
          -   For **multiple-choice** and **true/false** questions, if the answer is wrong, explain why the correct answer is right. If correct, briefly affirm it.
          -   For **short answer** questions, if the answer is incorrect or incomplete, provide the ideal, comprehensive answer.
          -   For **essay** questions, perform a detailed analysis:
              -   Provide overall feedback on the essay's structure, arguments, and accuracy.
              -   Break down the user's essay into text segments and classify each as 'green' (highly relevant and correct), 'orange' (partially correct or relevant but incomplete), 'grey' (irrelevant or incorrect), or 'none'.
              -   List specific points of correction or improvement.
              -   Suggest up to 3 distinct alternative ways the essay could have been answered, outlining the key marking points for each approach.
      4.  Provide a summary of the user's strengths and a constructive analysis of their weaknesses based on their overall performance.

      **Assessment & User Answers:**
      ---
      {{{questionsWithAnswers}}}
      ---
      `,
});

export async function evaluateAIAssessment(
  input: EvaluateAIAssessmentInput
): Promise<AssessmentEvaluationOutput> {
  const { assessment, userAnswers } = input;

  const questionsWithAnswers = assessment.questions.map((q, index) => {
    const userAnswer = userAnswers.find(a => a.questionIndex === index)?.answer || 'Not Answered';
    let questionText = `**Question ${index + 1} (${q.questionType}):**\n- Question: ${q.questionText}\n- Correct Answer: ${q.correctAnswer}`;
    if (q.options && q.options.length > 0) {
      questionText += `\n- Options: ${q.options.join(', ')}`;
    }
    questionText += `\n- User's Answer: ${userAnswer}\n`;
    return questionText;
  }).join('\n---\n');

  const { output } = await evaluationPrompt({
    ...input,
    questionsWithAnswers
  });
  
  if (!output) {
    throw new Error('Failed to evaluate AI assessment.');
  }
  return output;
}
