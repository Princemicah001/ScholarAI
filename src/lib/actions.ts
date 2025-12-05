
'use server';

import { extractContentFromUrl as extractContentFromUrlFlow } from '@/ai/flows/extract-content-from-url';
import { extractContentFromFile as extractContentFromFileFlow } from '@/ai/flows/extract-content-from-file';
import { generateStudyGuideFromContent } from '@/ai/flows/generate-study-guide-from-content';
import { generateAIAssessment as generateAIAssessmentFlow } from '@/ai/flows/generate-ai-assessment';
import { evaluateAIAssessment as evaluateAIAssessmentFlow } from '@/ai/flows/evaluate-ai-assessment';
import { generateNotesFromOutline } from '@/ai/flows/generate-notes-from-outline';
import { 
    textSchema, 
    urlSchema, 
    fileSchema,
    GenerateStudyGuideInputSchema, 
    type GenerateStudyGuideOutput,
    type GenerateAIAssessmentInput,
    type AIAssessment,
    type EvaluateAIAssessmentInput,
    type AssessmentEvaluationOutput
} from '@/lib/schemas';


type ActionResult<T> = {
    data?: T;
    error?: string;
    title?: string;
    extractedText?: string;
};

export async function createMaterialFromText(title: string, content: string): Promise<ActionResult<any>> {
    const validatedFields = textSchema.safeParse({ title, content });

    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors.title?.[0] || validatedFields.error.flatten().fieldErrors.content?.[0] || 'Invalid input.' };
    }

    return {
        title: validatedFields.data.title,
        extractedText: validatedFields.data.content,
    };
}


export async function createMaterialFromUrl(title: string, url: string): Promise<ActionResult<any>> {
    const validatedFields = urlSchema.safeParse({ title, url });

    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors.title?.[0] || validatedFields.error.flatten().fieldErrors.url?.[0] || 'Invalid input.' };
    }
    
    const { content: extractedText } = await extractContentFromUrlFlow({ url: validatedFields.data.url });

    return {
        title: validatedFields.data.title,
        extractedText: extractedText,
    };
}

export async function createMaterialFromFile(formData: FormData, source: 'file' | 'outline'): Promise<ActionResult<any>> {
     const values = {
        file: formData.get('file') as File,
    };

    const validatedFields = fileSchema.safeParse(values);
    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors.file?.[0] || 'Invalid file input.' };
    }

    const { file } = validatedFields.data;
    const title = file.name;

    const buffer = Buffer.from(await file.arrayBuffer());
    const dataURI = `data:${file.type};base64,${buffer.toString('base64')}`;

    const { content: rawText } = await extractContentFromFileFlow({ fileDataUri: dataURI });

    let finalText = rawText;

    if (source === 'outline') {
        // If it's an outline, generate comprehensive notes from the raw text.
        const { notes } = await generateNotesFromOutline({ outlineContent: rawText });
        finalText = notes;
    }

    return {
        title: title,
        extractedText: finalText,
    };
}

export async function generateStudyGuide(content: string, useOnlineSources: boolean): Promise<GenerateStudyGuideOutput> {
    const validatedFields = GenerateStudyGuideInputSchema.safeParse({ content, useOnlineSources });

    if (!validatedFields.success) {
        throw new Error('Invalid content for generating study guide.');
    }
    
    const { content: validContent } = validatedFields.data;

    if (!validContent) {
        throw new Error("Could not find content for this material.");
    }
    
    const studyGuide = await generateStudyGuideFromContent({ content: validContent, useOnlineSources });

    return studyGuide;
}

export async function generateAssessment(input: GenerateAIAssessmentInput): Promise<AIAssessment> {
    const assessment = await generateAIAssessmentFlow(input);
    return assessment;
}


export async function evaluateAssessment(input: EvaluateAIAssessmentInput): Promise<AssessmentEvaluationOutput> {
    const evaluation = await evaluateAIAssessmentFlow(input);
    return evaluation;
}
