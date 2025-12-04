'use server';

import { z } from 'zod';
import { extractContentFromUrl } from '@/ai/flows/extract-content-from-url';
import { extractContentFromFile } from '@/ai/flows/extract-content-from-file';
import { redirect } from 'next/navigation';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import { addDoc, collection, getFirestore } from 'firebase/firestore';

const urlSchema = z.object({
  sourceType: z.literal('url'),
  url: z.string().url(),
  userId: z.string(),
});

const textSchema = z.object({
  sourceType: z.literal('text'),
  title: z.string(),
  text: z.string(),
  userId: z.string(),
});

const fileSchema = z.object({
  sourceType: z.literal('file'),
  file: z.instanceof(File),
  userId: z.string(),
});


// This is a temporary solution to get a server-side firebase instance
// In a real app, you would use the Admin SDK
function getUnsafeServerFirebase() {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const firestore = getFirestore(app);
    return { firestore };
}

async function fileToDataUri(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return `data:${file.type};base64,${buffer.toString('base64')}`;
}

export async function createMaterial(formData: FormData) {
  const sourceType = formData.get('sourceType') as 'url' | 'text' | 'file';
  const userId = formData.get('userId') as string;

  if (!userId) {
    throw new Error("You must be logged in to create a material.");
  }
  
  let title: string;
  let extractedText: string;
  let sourceUrl: string | undefined = undefined;

  switch (sourceType) {
    case 'url':
      const url = formData.get('url') as string;
      if (!url) throw new Error('URL is required.');
      const extractedData = await extractContentFromUrl({ url });
      title = extractedData.title;
      extractedText = extractedData.content;
      sourceUrl = url;
      break;
    
    case 'text':
      title = formData.get('title') as string;
      extractedText = formData.get('text') as string;
      if (!title || !extractedText) throw new Error('Title and text are required.');
      break;

    case 'file':
      const file = formData.get('file') as File;
      if (!file) throw new Error('File is required.');
      title = file.name;
      const fileDataUri = await fileToDataUri(file);
      const ocrResult = await extractContentFromFile({ fileDataUri });
      extractedText = ocrResult.extractedText;
      break;

    default:
      throw new Error('Invalid source type.');
  }


  const { firestore } = getUnsafeServerFirebase();
  const materialsCollection = collection(firestore, `users/${userId}/studyMaterials`);

  const newMaterial = {
    userId,
    title,
    sourceType,
    sourceUrl,
    extractedText,
    uploadDate: new Date().toISOString(),
  };

  const docRef = await addDoc(materialsCollection, newMaterial);
  
  redirect(`/materials/${docRef.id}`);
}
