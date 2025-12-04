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
  questionType: z.enum(['multiple_choice', 'flashcard', 'short_answer', 'essay']).describe('The type of the question.'),
  options: z.array(z.string()).optional().describe('A list of possible answers for multiple-choice questions.'),
  correctAnswer: z.string().describe('The correct answer. For true/false, it should be "True" or "False".'),
  explanation: z.string().describe('A brief explanation of why the answer is correct.'),
});
export type Question = z.infer<typeof QuestionSchema>;

// Define the schema for the entire assessment
export const AIAssessmentSchema = z.object({
  questions: z.array(QuestionSchema).describe('A list of generated assessment questions.'),
  timer: z.number().optional().describe('The allotted time for the test in minutes. Optional.'),
});

// Define the input schema for the assessment generation flow
export const GenerateAIAssessmentInputSchema = z.object({
  content: z.string().describe('The source text to generate the assessment from.'),
  questionCount: z.number().min(1).max(20).describe('The number of questions to generate.'),
  questionTypes: z.array(z.enum(['multiple_choice', 'flashcard', 'short_answer', 'essay'])).min(1).describe('The types of questions to generate.'),
  timer: z.number().optional().describe('The allotted time for the test in minutes. Optional.'),
});

export type AIAssessment = z.infer<typeof AIAssessmentSchema>;
export type GenerateAIAssessmentInput = z.infer<typeof GenerateAIAssessmentInputSchema>;


// Schemas for Assessment Evaluation
const EssayHighlightSchema = z.object({
  text: z.string().describe("A segment of the user's essay text."),
  highlight: z.enum(['green', 'orange', 'grey', 'none']).describe("Classification: green (correct/relevant), orange (partially relevant), grey (irrelevant), none (no highlight).")
});

const AlternativeEssaySchema = z.object({
  title: z.string().describe("A title for the alternative approach (e.g., 'Focusing on the Causes')."),
  content: z.string().describe("A brief description of how the essay could have been answered differently, including key marking points.")
});

export const EvaluationResultSchema = z.object({
  questionIndex: z.number().describe('The index of the question being evaluated.'),
  isCorrect: z.boolean().describe('Whether the user\'s answer was correct.'),
  feedback: z.string().describe('Detailed feedback for the user\'s answer. For MCQ/T-F, explains the correct answer. For Short Answer, provides the ideal response. For essays, provides overall feedback.'),
  essayEvaluation: z.object({
    highlightedText: z.array(EssayHighlightSchema).describe("The user's essay, broken down into segments with highlight classifications."),
    corrections: z.array(z.string()).describe("Specific points of correction for the essay."),
    alternativeAnswers: z.array(AlternativeEssaySchema).describe("Up to 3 alternative ways the essay could have been effectively answered.")
  }).optional().describe("Detailed evaluation specific to essay questions.")
});

export const AssessmentEvaluationOutputSchema = z.object({
  overallScore: z.number().describe("The final percentage score for the entire assessment (0-100)."),
  strengthSummary: z.string().describe("A brief summary of the user's strengths shown in the assessment."),
  weaknessAnalysis: z.string().describe("A brief analysis of the user's weaknesses and areas for improvement."),
  results: z.array(EvaluationResultSchema).describe('A detailed breakdown of the evaluation for each question.')
});

export const UserAnswerSchema = z.object({
    questionIndex: z.number(),
    answer: z.string(),
});

export const EvaluateAIAssessmentInputSchema = z.object({
    assessment: AIAssessmentSchema,
    userAnswers: z.array(UserAnswerSchema),
    questionsWithAnswers: z.string().optional()
});

export type AssessmentEvaluationOutput = z.infer<typeof AssessmentEvaluationOutputSchema>;
export type EvaluateAIAssessmentInput = z.infer<typeof EvaluateAIAssessmentInputSchema>;
export type UserAnswer = z.infer<typeof UserAnswerSchema>;
export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;
