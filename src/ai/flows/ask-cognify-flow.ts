'use server';

/**
 * @fileOverview Defines the Genkit flow for the "Ask Cognify" chatbot.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const AskCognifyInputSchema = z.object({
  query: z.string().describe('The user\'s question.'),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).describe('The conversation history.'),
});

export const AskCognifyOutputSchema = z.object({
  response: z.string().describe('The AI\'s response to the user\'s query.'),
});

export type AskCognifyInput = z.infer<typeof AskCognifyInputSchema>;
export type AskCognifyOutput = z.infer<typeof AskCognifyOutputSchema>;

export async function askCognify(input: AskCognifyInput): Promise<AskCognifyOutput> {
  const askCognifyPrompt = ai.definePrompt(
    {
      name: 'askCognifyPrompt',
      input: { schema: AskCognifyInputSchema },
      output: { schema: AskCognifyOutputSchema },
      prompt: `You are Cognify, a friendly and knowledgeable AI study assistant. Your goal is to help users understand their study materials better.

      Conversation History:
      {{#each history}}
      {{this.role}}: {{this.content}}
      {{/each}}

      User's New Question:
      {{{query}}}

      Your response should be helpful, concise, and directly related to the user's questions.
      `,
    },
  );

  const { output } = await askCognifyPrompt(input);
  if (!output) {
    throw new Error('Failed to get a response from the AI.');
  }
  return output;
}
