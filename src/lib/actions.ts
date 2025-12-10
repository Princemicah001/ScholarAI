
'use server';

import { extractContentFromUrl as extractContentFromUrlFlow } from '@/ai/flows/extract-content-from-url';
import { extractContentFromFile as extractContentFromFileFlow } from '@/ai/flows/extract-content-from-file';
import { generateStudyGuideFromContent } from '@/ai/flows/generate-study-guide-from-content';
import { generateAIAssessment as generateAIAssessmentFlow } from '@/ai/flows/generate-ai-assessment';
import { evaluateAIAssessment as evaluateAIAssessmentFlow } from '@/ai/flows/evaluate-ai-assessment';
import { generateNotesFromOutline } from '@/ai/flows/generate-notes-from-outline';
import { isContentOutline as isContentOutlineFlow } from '@/ai/flows/is-content-outline';
import { askCognify as askCognifyFlow } from '@/ai/flows/ask-cognify-flow';
import { 
    textAndUrlSchema, 
    fileSchema,
    GenerateStudyGuideInputSchema, 
    type GenerateStudyGuideOutput,
    type GenerateAIAssessmentInput,
    type AIAssessment,
    type EvaluateAIAssessmentInput,
    type AssessmentEvaluationOutput,
    type AskCognifyInput
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
        try {
            const { content: extractedText } = await extractContentFromUrlFlow({ url: validatedContent });
            return {
                title: validatedTitle,
                extractedText: extractedText,
            };
        } catch (e: any) {
            return { error: `Could not extract content from URL: ${e.message}`};
        }
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

    const validatedFields = fileSchema.safeParse({ file });
    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors.file?.[0] || 'Invalid file input.' };
    }

    const { file: validatedFile } = validatedFields.data;
    const title = validatedFile.name;

    try {
        const buffer = Buffer.from(await validatedFile.arrayBuffer());
        const dataURI = `data:${validatedFile.type};base64,${buffer.toString('base64')}`;

        const { content: rawText } = await extractContentFromFileFlow({ fileDataUri: dataURI });

        // Check if the content is an outline. If so, expand it.
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
    } catch (e: any) {
        // The error is now constructed to be more specific, including the model's response if available.
        const errorMessage = e.message || 'An unknown error occurred during file processing.';
        return { error: `Failed to process file "${title}": ${errorMessage}`};
    }
}

export async function generateStudyGuide(content: string, useOnlineSources: boolean): Promise<GenerateStudyGuideOutput> {
    const validatedFields = GenerateStudyGuideInputSchema.safeParse({ content, useOnlineSources });

    if (!validatedFields.success) {
        throw new Error('Invalid content for generating study guide.');
    }
    
    const { content: validContent, useOnlineSources: validUseOnlineSources } = validatedFields.data;

    if (!validContent) {
        throw new Error("Could not find content for this material.");
    }
    
    const studyGuide = await generateStudyGuideFromContent({ content: validContent, useOnlineSources: validUseOnlineSources });

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

export async function askCognify(input: AskCognifyInput): Promise<{ response?: string, error?: string }> {
    try {
        const result = await askCognifyFlow(input);
        return { response: result.response };
    } catch (error: any) {
        console.error("Error in askCognify action: ", error);
        return { error: error.message || 'An unexpected error occurred.' };
    }
}

    