'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import { addDoc, collection, getFirestore } from 'firebase/firestore';
import { extractContentFromUrl } from '@/ai/flows/extract-content-from-url';
import { extractContentFromFile } from '@/ai/flows/extract-content-from-file';
import { generateStudyGuideFromContent } from '@/ai/flows/generate-study-guide-from-content';

const formSchema = z.object({
  sourceType: z.enum(['text', 'url', 'file']),
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  content: z.string().min(50, 'Text content must be at least 50 characters.').optional(),
  url: z.string().url('Please enter a valid URL.').optional(),
  file: z.any().optional(),
  userId: z.string(),
});

// This is a temporary solution to get a server-side firebase instance
// In a real app, you would use the Admin SDK
function getUnsafeServerFirebase() {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const firestore = getFirestore(app);
    return { firestore };
}

async function saveMaterial(userId: string, title: string, sourceType: string, extractedText: string) {
    if (!userId) {
        throw new Error("You must be logged in to create a material.");
    }
    const { firestore } = getUnsafeServerFirebase();
    const materialsCollection = collection(firestore, `users/${userId}/studyMaterials`);

    const newMaterial = {
        userId,
        title,
        sourceType,
        extractedText,
        uploadDate: new Date().toISOString(),
    };

    const docRef = await addDoc(materialsCollection, newMaterial);
    return docRef.id;
}


export async function createMaterialFromText(formData: FormData) {
    const values = {
        sourceType: 'text',
        title: formData.get('title'),
        content: formData.get('content'),
        userId: formData.get('userId'),
    };

    const validatedFields = formSchema.pick({ title: true, content: true, userId: true }).safeParse(values);

    if (!validatedFields.success) {
        throw new Error(validatedFields.error.flatten().fieldErrors.title?.[0] || validatedFields.error.flatten().fieldErrors.content?.[0] || 'Invalid input.');
    }

    const { userId, title, content } = validatedFields.data;

    const docId = await saveMaterial(userId, title, 'text', content!);
    redirect(`/materials/${docId}`);
}


export async function createMaterialFromUrl(formData: FormData) {
    const values = {
        sourceType: 'url',
        title: formData.get('title'),
        url: formData.get('url'),
        userId: formData.get('userId'),
    };
    
    const validatedFields = formSchema.pick({ title: true, url: true, userId: true }).safeParse(values);
    
    if (!validatedFields.success) {
        throw new Error(validatedFields.error.flatten().fieldErrors.title?.[0] || validatedFields.error.flatten().fieldErrors.url?.[0] || 'Invalid input.');
    }

    const { userId, title, url } = validatedFields.data;
    
    const extractedText = await extractContentFromUrl({ url: url! });
    
    const docId = await saveMaterial(userId, title, 'url', extractedText.content);
    redirect(`/materials/${docId}`);
}

export async function createMaterialFromFile(formData: FormData) {
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    
    if (!file || file.size === 0) {
        throw new Error('Please select a file to upload.');
    }
     if (!userId) {
        throw new Error('User not authenticated.');
    }

    const title = file.name;

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64File = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64File}`;

    const extractedText = await extractContentFromFile({ fileDataUri: dataURI });

    const docId = await saveMaterial(userId, title, 'file', extractedText.content);
    redirect(`/materials/${docId}`);
}

export async function generateStudyGuide(materialId: string, userId: string) {
    const { firestore } = getUnsafeServerFirebase();
    const materialRef = collection(firestore, `users/${userId}/studyMaterials`);
    const docRef = (await addDoc(materialRef, {})).parent.doc(materialId);
    
    // This is a placeholder for getting the document content.
    // In a real scenario, you'd fetch the document from Firestore.
    // For now, let's assume we have the text.
    // const material = await getDoc(docRef);
    // const text = material.data()?.extractedText;

    // This is a placeholder text.
    const text = "The content of the study material would go here.";

    const studyGuide = await generateStudyGuideFromContent({ content: text });

    return studyGuide;
}
