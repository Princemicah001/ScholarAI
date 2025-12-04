'use server';

import { z } from 'zod';
import { extractContentFromUrl } from '@/ai/flows/extract-content-from-url';
import { redirect } from 'next/navigation';
import { getAuth } from 'firebase/auth';
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

const formSchema = z.discriminatedUnion('sourceType', [urlSchema, textSchema]);

// This is a temporary solution to get a server-side firebase instance
// In a real app, you would use the Admin SDK
function getUnsafeServerFirebase() {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const firestore = getFirestore(app);
    return { firestore };
}


export async function createMaterial(values: unknown) {
  const parsedValues = formSchema.safeParse(values);

  if (!parsedValues.success) {
    throw new Error('Invalid form data.');
  }
  const {userId} = parsedValues.data;
  if (!userId) {
    throw new Error("You must be logged in to create a material.");
  }


  let title: string;
  let extractedText: string;
  const sourceType = parsedValues.data.sourceType;
  const sourceUrl = parsedValues.data.sourceType === "url" ? parsedValues.data.url : undefined;
  
  if (parsedValues.data.sourceType === 'url') {
    const extractedData = await extractContentFromUrl({ url: parsedValues.data.url });
    title = extractedData.title;
    extractedText = extractedData.content;
  } else {
    title = parsedValues.data.title;
    extractedText = parsedValues.data.text;
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
