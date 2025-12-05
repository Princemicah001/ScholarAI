
'use server';

import { extractContentFromUrl as extractContentFromUrlFlow } from '@/ai/flows/extract-content-from-url';
import { extractContentFromFile as extractContentFromFileFlow } from '@/ai/flows/extract-content-from-file';
import { generateStudyGuideFromContent } from '@/ai/flows/generate-study-guide-from-content';
import { generateAIAssessment as generateAIAssessmentFlow } from '@/ai/flows/generate-ai-assessment';
import { evaluateAIAssessment as evaluateAIAssessmentFlow } from '@/ai/flows/evaluate-ai-assessment';
import { generateNotesFromOutline } from '@/ai/flows/generate-notes-from-outline';
import { isContentOutline as isContentOutlineFlow } from '@/ai/flows/is-content-outline';
import { 
    textAndUrlSchema, 
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

function isValidUrl(string: string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

export async function createMaterialFromTextOrUrl(title: string, content: string): Promise<ActionResult<any>> {
    const validatedFields = textAndUrlSchema.safeParse({ title, content });

    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors.title?.[0] || validatedFields.error.flatten().fieldErrors.content?.[0] || 'Invalid input.' };
    }

    const { title: validatedTitle, content: validatedContent } = validatedFields.data;

    if (isValidUrl(validatedContent)) {
        // It's a URL, fetch the content
        const { content: extractedText } = await extractContentFromUrlFlow({ url: validatedContent });
        return {
            title: validatedTitle,
            extractedText: extractedText,
        };
    } else {
        // It's plain text
        return {
            title: validatedTitle,
            extractedText: validatedContent,
        };
    }
}


export async function createMaterialFromFile(formData: FormData): Promise<ActionResult<any>> {
     const file = formData.get('file') as File;
     if (!file) {
        return { error: 'No file found in form data.' };
     }

     const values = { file };

    const validatedFields = fileSchema.safeParse(values);
    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors.file?.[0] || 'Invalid file input.' };
    }

    const { file: validatedFile } = validatedFields.data;
    const title = validatedFile.name;

    const buffer = Buffer.from(await validatedFile.arrayBuffer());
    const dataURI = `data:${validatedFile.type};base64,${buffer.toString('base64')}`;

    const { content: rawText } = await extractContentFromFileFlow({ fileDataUri: dataURI });

    const { isOutline } = await isContentOutlineFlow({ content: rawText });

    let finalText = rawText;
    if (isOutline) {
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
