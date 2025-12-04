'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import { addDoc, collection, getFirestore } from 'firebase/firestore';

const textSchema = z.object({
  sourceType: z.literal('text'),
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  text: z.string().min(50, 'Text must be at least 50 characters.'),
  userId: z.string(),
});

// This is a temporary solution to get a server-side firebase instance
// In a real app, you would use the Admin SDK
function getUnsafeServerFirebase() {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const firestore = getFirestore(app);
    return { firestore };
}

export async function createMaterial(formData: FormData) {
  const userId = formData.get('userId') as string;
  if (!userId) {
    throw new Error("You must be logged in to create a material.");
  }
  
  const title = formData.get('title') as string;
  const extractedText = formData.get('text') as string;
  
  const result = textSchema.safeParse({
    sourceType: 'text',
    title,
    text: extractedText,
    userId,
  });

  if (!result.success) {
    throw new Error(result.error.errors.map(e => e.message).join(', '));
  }

  const { firestore } = getUnsafeServerFirebase();
  const materialsCollection = collection(firestore, `users/${userId}/studyMaterials`);

  const newMaterial = {
    userId,
    title,
    sourceType: 'text',
    extractedText,
    uploadDate: new Date().toISOString(),
  };

  const docRef = await addDoc(materialsCollection, newMaterial);
  
  redirect(`/materials/${docRef.id}`);
}
