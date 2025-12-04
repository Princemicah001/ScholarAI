'use server';

import { z } from 'zod';
import { extractContentFromUrl } from '@/ai/flows/extract-content-from-url';
import { redirect } from 'next/navigation';

const urlSchema = z.object({
  sourceType: z.literal('url'),
  url: z.string().url(),
});

const textSchema = z.object({
  sourceType: z.literal('text'),
  title: z.string(),
  text: z.string(),
});

const formSchema = z.discriminatedUnion('sourceType', [urlSchema, textSchema]);

export async function createMaterial(values: unknown) {
  const parsedValues = formSchema.safeParse(values);

  if (!parsedValues.success) {
    throw new Error('Invalid form data.');
  }

  let title: string;
  let content: string;
  
  if (parsedValues.data.sourceType === 'url') {
    const extractedData = await extractContentFromUrl({ url: parsedValues.data.url });
    title = extractedData.title;
    content = extractedData.content;
  } else {
    title = parsedValues.data.title;
    content = parsedValues.data.text;
  }

  // TODO: Save to Firestore
  // For now, we'll just log and redirect to a placeholder ID
  const newMaterialId = 'placeholder-id-' + Date.now();
  console.log('Creating material:', { id: newMaterialId, title, content: content.substring(0, 100) + '...' });
  
  redirect(`/materials/${newMaterialId}`);
}
