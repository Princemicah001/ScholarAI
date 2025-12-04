'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import { addDoc, collection, doc, getDoc, getFirestore } from 'firebase/firestore';

import { 
    extractContentFromUrl, 
} from '@/ai/flows/extract-content-from-url';
import { 
    extractContentFromFile,
} from '@/ai/flows/extract-content-from-file';
import { 
    generateStudyGuideFromContent,
    type GenerateStudyGuideOutput 
} from '@/ai/flows/generate-study-guide-from-content';


// Schemas for form validation
const textSchema = z.object({
  userId: z.string(),
  title: z.string().min(3, { message: 'Title must be at least 3 characters.' }),
  content: z.string().min(50, { message: 'Text content must be at least 50 characters.' }),
});

const urlSchema = z.object({
  userId: z.string(),
  title: z.string().min(3, { message: 'Title must be at least 3 characters.' }),
  url: z.string().url({ message: 'Please enter a valid URL.' }),
});

const fileSchema = z.object({
  userId: z.string(),
  file: z.instanceof(File).refine((file) => file.size > 0, 'Please upload a file.'),
});

// This is a temporary solution to get a server-side firebase instance
// In a real app, you would use the Admin SDK
function getUnsafeServerFirebase() {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const firestore = getFirestore(app);
    return { firestore };
}

async function saveMaterial(userId: string, title: string, sourceType: string, extractedText: string, sourceUrl?: string) {
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
        sourceUrl: sourceUrl || '',
        uploadDate: new Date().toISOString(),
    };

    const docRef = await addDoc(materialsCollection, newMaterial);
    return docRef.id;
}


export async function createMaterialFromText(formData: FormData) {
    const values = {
        userId: formData.get('userId'),
        title: formData.get('title'),
        content: formData.get('content'),
    };

    const validatedFields = textSchema.safeParse(values);

    if (!validatedFields.success) {
        throw new Error(validatedFields.error.flatten().fieldErrors.title?.[0] || validatedFields.error.flatten().fieldErrors.content?.[0] || 'Invalid input.');
    }

    const { userId, title, content } = validatedFields.data;

    const docId = await saveMaterial(userId, title, 'text', content);
    redirect(`/materials/${docId}`);
}


export async function createMaterialFromUrl(formData: FormData) {
    const values = {
        userId: formData.get('userId'),
        title: formData.get('title'),
        url: formData.get('url'),
    };
    
    const validatedFields = urlSchema.safeParse(values);
    
    if (!validatedFields.success) {
        throw new Error(validatedFields.error.flatten().fieldErrors.title?.[0] || validatedFields.error.flatten().fieldErrors.url?.[0] || 'Invalid input.');
    }

    const { userId, title, url } = validatedFields.data;
    
    const { content: extractedText } = await extractContentFromUrl({ url });
    
    const docId = await saveMaterial(userId, title, 'url', extractedText, url);
    redirect(`/materials/${docId}`);
}

export async function createMaterialFromFile(formData: FormData) {
     const values = {
        userId: formData.get('userId') as string,
        file: formData.get('file') as File,
    };

    const validatedFields = fileSchema.safeParse(values);
    if (!validatedFields.success) {
        throw new Error(validatedFields.error.flatten().fieldErrors.file?.[0] || 'Invalid file input.');
    }
    
    const { userId, file } = validatedFields.data;
    const title = file.name;

    const buffer = Buffer.from(await file.arrayBuffer());
    const dataURI = `data:${file.type};base64,${buffer.toString('base64')}`;

    const { content: extractedText } = await extractContentFromFile({ fileDataUri: dataURI });

    const docId = await saveMaterial(userId, title, 'file', extractedText);
    redirect(`/materials/${docId}`);
}

export async function generateStudyGuide(materialId: string, userId: string): Promise<GenerateStudyGuideOutput> {
    const { firestore } = getUnsafeServerFirebase();
    const materialRef = doc(firestore, `users/${userId}/studyMaterials`, materialId);
    
    const materialSnap = await getDoc(materialRef);

    if (!materialSnap.exists()) {
        throw new Error("Study material not found.");
    }

    const text = materialSnap.data()?.extractedText;

    if (!text) {
        throw new Error("Could not find content for this material.");
    }
    
    const studyGuide = await generateStudyGuideFromContent({ content: text });

    return studyGuide;
}
