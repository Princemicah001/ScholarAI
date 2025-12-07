
'use server';

/**
 * @fileOverview Defines the Genkit flow for the "Ask Cognify" chatbot.
 */

import { ai } from '@/ai/genkit';
import { AskCognifyInputSchema, AskCognifyOutputSchema, type AskCognifyInput, type AskCognifyOutput } from '@/lib/schemas';


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
