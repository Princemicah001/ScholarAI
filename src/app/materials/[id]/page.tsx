'use client';

import { DashboardLayout } from "@/components/dashboard-layout";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDoc, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Book, Bot } from "lucide-react";
import { generateStudyGuideFromContent, GenerateStudyGuideOutput } from "@/ai/flows/generate-study-guide-from-content";
import { generateAIAssessment, GenerateAIAssessmentOutput } from "@/ai/flows/generate-ai-assessment";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";


export default function MaterialPage({ params }: { params: { id: string } }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const [formattedDate, setFormattedDate] = React.useState('');
    const { toast } = useToast();

    const [studyGuide, setStudyGuide] = useState<GenerateStudyGuideOutput | null>(null);
    const [assessment, setAssessment] = useState<GenerateAIAssessmentOutput | null>(null);
    const [isGuideLoading, setIsGuideLoading] = useState(false);
    const [isAssessmentLoading, setIsAssessmentLoading] = useState(false);


    const materialRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid, 'studyMaterials', params.id);
    }, [firestore, user, params.id]);

    const { data: material, isLoading } = useDoc(materialRef);

    React.useEffect(() => {
        if (material?.uploadDate) {
            const date = new Date(material.uploadDate);
            // A simple check to see if the date is valid before formatting
            if (!isNaN(date.getTime())) {
                setFormattedDate(date.toLocaleDateString());
            }
        }
    }, [material?.uploadDate]);

    const handleGenerateStudyGuide = async () => {
        if (!material) return;
        setIsGuideLoading(true);
        setStudyGuide(null);
        try {
            const result = await generateStudyGuideFromContent({ content: material.extractedText });
            setStudyGuide(result);
        } catch (e) {
            console.error(e);
            toast({
                variant: 'destructive',
                title: 'Error Generating Study Guide',
                description: 'There was an issue creating the study guide. Please try again.'
            })
        } finally {
            setIsGuideLoading(false);
        }
    }

    const handleGenerateAssessment = async () => {
        if (!material) return;
        setIsAssessmentLoading(true);
        setAssessment(null);
        try {
            const result = await generateAIAssessment({ 
                studyMaterials: material.extractedText,
                assessmentTypes: ['multiple_choice', 'flashcard'],
                numberOfQuestions: 5,
            });
            setAssessment(result);
        } catch (e) {
            console.error(e);
             toast({
                variant: 'destructive',
                title: 'Error Generating Assessment',
                description: 'There was an issue creating the assessment. Please try again.'
            })
        } finally {
            setIsAssessmentLoading(false);
        }
    }


    if (isLoading) {
        return (
            <DashboardLayout>
                <PageHeader 
                    title={<Skeleton className="h-8 w-64" />}
                    description={<Skeleton className="h-4 w-48" />}
                />
                 <div className="mt-8 grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Original Content</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                            </CardContent>
                        </Card>
                    </div>
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>AI Tools</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                               <Skeleton className="h-10 w-full" />
                               <Skeleton className="h-10 w-full" />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    if (!material) {
        return (
            <DashboardLayout>
                <PageHeader 
                    title="Material not found"
                    description="Could not find the requested study material."
                />
            </DashboardLayout>
        )
    }


    return (
        <DashboardLayout>
            <PageHeader 
                title={material.title}
                description={formattedDate ? `Created on ${formattedDate}` : ''}
            />

            <div className="mt-8 grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Original Content</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose dark:prose-invert max-w-none">
                                <p className="whitespace-pre-wrap">{material.extractedText}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {studyGuide && (
                        <Card>
                            <CardHeader>
                                <CardTitle>AI Generated Study Guide</CardTitle>
                            </CardHeader>
                            <CardContent>
                               <div className="prose dark:prose-invert max-w-none">
                                 <p className="whitespace-pre-wrap">{studyGuide.studyGuide}</p>
                               </div>
                            </CardContent>
                        </Card>
                    )}
                    {assessment && (
                        <Card>
                            <CardHeader>
                                <CardTitle>AI Generated Assessment</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Accordion type="single" collapsible className="w-full">
                                    {assessment.questions.map((q, i) => (
                                        <AccordionItem value={`item-${i}`} key={i}>
                                            <AccordionTrigger>{i+1}. {q.question}</AccordionTrigger>
                                            <AccordionContent>
                                               <p className="font-bold">Answer:</p>
                                               <p>{q.answer}</p>
                                               {q.options && (
                                                <div className="mt-2">
                                                    <p className="font-bold">Options:</p>
                                                    <ul className="list-disc pl-5">
                                                        {q.options.map((opt, j) => <li key={j}>{opt}</li>)}
                                                    </ul>
                                                </div>
                                               )}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </CardContent>
                        </Card>
                    )}

                </div>
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>AI Tools</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground text-sm">
                                Generate study guides and assessments from your material.
                            </p>
                            <Button 
                                onClick={handleGenerateStudyGuide}
                                disabled={isGuideLoading || isAssessmentLoading} 
                                className="w-full"
                            >
                                {isGuideLoading ? 'Generating...' : <> <Book className="mr-2"/> Generate Study Guide </>}
                            </Button>
                            <Button 
                                onClick={handleGenerateAssessment}
                                disabled={isGuideLoading || isAssessmentLoading}
                                className="w-full"
                            >
                               {isAssessmentLoading ? 'Generating...' : <> <Bot className="mr-2"/> Generate Assessment </>}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
