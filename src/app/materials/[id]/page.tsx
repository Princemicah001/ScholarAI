'use client';

import React, { useTransition } from "react";
import { useDoc, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

import { DashboardLayout } from "@/components/dashboard-layout";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BookOpen, LoaderCircle, TestTube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateStudyGuide, generateAssessment } from "@/lib/actions";
import { GenerateStudyGuideOutput, AIAssessment, GenerateAIAssessmentInput } from "@/lib/schemas";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

function StudyGuideDisplay({ studyGuide }: { studyGuide: GenerateStudyGuideOutput }) {
    return (
        <Accordion type="multiple" defaultValue={['summary', 'key-points']} className="w-full">
            <AccordionItem value="summary">
                <AccordionTrigger>Executive Summary</AccordionTrigger>
                <AccordionContent className="prose dark:prose-invert max-w-none">
                    <p>{studyGuide.summary}</p>
                </AccordionContent>
            </AccordionItem>
             <AccordionItem value="key-points">
                <AccordionTrigger>Key Points</AccordionTrigger>
                <AccordionContent className="prose dark:prose-invert max-w-none">
                    <ul>
                        {studyGuide.keyPoints.map((point, index) => (
                            <li key={index}>{point}</li>
                        ))}
                    </ul>
                </AccordionContent>
            </AccordionItem>
            {studyGuide.definitions.length > 0 && (
                <AccordionItem value="definitions">
                    <AccordionTrigger>Definitions</AccordionTrigger>
                    <AccordionContent className="prose dark:prose-invert max-w-none">
                        <dl>
                            {studyGuide.definitions.map((item, index) => (
                                <React.Fragment key={index}>
                                    <dt>{item.term}</dt>
                                    <dd>{item.definition}</dd>
                                </React.Fragment>
                            ))}
                        </dl>
                    </AccordionContent>
                </AccordionItem>
            )}
             {studyGuide.concepts.length > 0 && (
                <AccordionItem value="concepts">
                    <AccordionTrigger>Explained Concepts</AccordionTrigger>
                    <AccordionContent className="prose dark:prose-invert max-w-none">
                         {studyGuide.concepts.map((item, index) => (
                            <div key={index} className="mb-4">
                                <strong>{item.concept}</strong>
                                <p>{item.explanation}</p>
                            </div>
                        ))}
                    </AccordionContent>
                </AccordionItem>
            )}
             {studyGuide.examples.length > 0 && (
                <AccordionItem value="examples">
                    <AccordionTrigger>Examples</AccordionTrigger>
                    <AccordionContent className="prose dark:prose-invert max-w-none">
                        {studyGuide.examples.map((item, index) => (
                            <div key={index} className="mb-4">
                                <strong>{item.concept}</strong>
                                <p>{item.example}</p>
                            </div>
                        ))}
                    </AccordionContent>
                </AccordionItem>
             )}
             {studyGuide.mnemonics.length > 0 && (
                <AccordionItem value="mnemonics">
                    <AccordionTrigger>Memorization Cues</AccordionTrigger>
                    <AccordionContent className="prose dark:prose-invert max-w-none">
                       <ul>
                            {studyGuide.mnemonics.map((cue, index) => (
                                <li key={index}>{cue}</li>
                            ))}
                        </ul>
                    </AccordionContent>
                </AccordionItem>
             )}
        </Accordion>
    )
}


export default function MaterialPage({ params }: { params: { id: string } }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isGuideLoading, startGuideTransition] = useTransition();
    const [isAssessmentLoading, startAssessmentTransition] = useTransition();
    const [studyGuide, setStudyGuide] = React.useState<GenerateStudyGuideOutput | null>(null);
    const [assessment, setAssessment] = React.useState<AIAssessment | null>(null);

    const materialRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid, 'studyMaterials', params.id);
    }, [firestore, user, params.id]);

    const { data: material, isLoading } = useDoc(materialRef);

    const formattedDate = React.useMemo(() => {
        if (!material?.uploadDate) return '';
        try {
            return new Date(material.uploadDate).toLocaleDateString();
        } catch (e) {
            return '';
        }
    }, [material?.uploadDate]);

    const handleGenerateStudyGuide = () => {
        if (!material?.extractedText) return;

        startGuideTransition(async () => {
            try {
                const guide = await generateStudyGuide(material.extractedText);
                setStudyGuide(guide);
                toast({
                    title: "Study Guide Generated",
                    description: "Your AI-powered study guide is ready.",
                });
            } catch (error: any) {
                 toast({
                    variant: "destructive",
                    title: "Generation Failed",
                    description: error.message || "Could not generate the study guide.",
                });
            }
        });
    }

    const handleGenerateAssessment = () => {
        if (!material?.extractedText) return;

        startAssessmentTransition(async () => {
            try {
                const assessmentInput: GenerateAIAssessmentInput = {
                    content: material.extractedText,
                    questionCount: 5, // Default for now
                    questionTypes: ['multiple_choice', 'true_false'], // Default for now
                };
                const generatedAssessment = await generateAssessment(assessmentInput);
                setAssessment(generatedAssessment);
                toast({
                    title: "Assessment Generated",
                    description: "Your AI-powered assessment is ready.",
                });
            } catch (error: any) {
                 toast({
                    variant: "destructive",
                    title: "Generation Failed",
                    description: error.message || "Could not generate the assessment.",
                });
            }
        });
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <PageHeader
                    title={<Skeleton className="h-8 w-64" />}
                    description={<Skeleton className="h-4 w-48" />}
                />
                 <div className="mt-8 grid gap-8 md:grid-cols-2">
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
                    <Card>
                        <CardHeader>
                            <CardTitle>AI Tools</CardTitle>
                             <CardDescription>Generate study aids from your material.</CardDescription>
                        </Header>
                         <CardContent className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
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
            <div className="mt-8 grid gap-8 lg:grid-cols-2">
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

                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>AI Tools</CardTitle>
                            <CardDescription>Generate study aids from your material.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <Button onClick={handleGenerateStudyGuide} disabled={isGuideLoading || !material.extractedText}>
                                {isGuideLoading ? (
                                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <BookOpen className="mr-2 h-4 w-4" />
                                )}
                                Generate Study Guide
                            </Button>
                             <Button variant="secondary" onClick={handleGenerateAssessment} disabled={isAssessmentLoading || !material.extractedText}>
                                {isAssessmentLoading ? (
                                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <TestTube className="mr-2 h-4 w-4" />
                                )}
                                Generate Assessment
                            </Button>
                        </CardContent>
                    </Card>

                    {isGuideLoading && (
                         <Card>
                            <CardHeader>
                                <CardTitle>Generating Study Guide...</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Skeleton className="h-6 w-1/3" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                                <br/>
                                <Skeleton className="h-6 w-1/4" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                            </CardContent>
                        </Card>
                    )}

                    {studyGuide && (
                         <Card>
                            <CardHeader>
                                <CardTitle>AI Generated Study Guide</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <StudyGuideDisplay studyGuide={studyGuide} />
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
