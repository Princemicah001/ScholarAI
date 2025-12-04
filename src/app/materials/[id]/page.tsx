'use client';

import React, { useTransition } from "react";
import { useDoc, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

import { DashboardLayout } from "@/components/dashboard-layout";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BookOpen, LoaderCircle, TestTube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateStudyGuide, generateAssessment } from "@/lib/actions";
import { GenerateStudyGuideOutput, AIAssessment, GenerateAIAssessmentInput, Question } from "@/lib/schemas";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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

function AssessmentConfigDialog({ onStart, isLoading }: { onStart: (config: GenerateAIAssessmentInput) => void; isLoading: boolean; }) {
    const [questionCount, setQuestionCount] = React.useState(5);
    const [questionTypes, setQuestionTypes] = React.useState<GenerateAIAssessmentInput['questionTypes']>(['multiple_choice']);

    const handleTypeChange = (type: 'multiple_choice' | 'true_false' | 'short_answer', checked: boolean) => {
        setQuestionTypes(prev => {
            const newTypes = checked ? [...prev, type] : prev.filter(t => t !== type);
            // Ensure at least one type is selected
            if (newTypes.length === 0) return ['multiple_choice'];
            return newTypes;
        })
    }
    
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="secondary" disabled={isLoading}>
                    {isLoading ? (
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <TestTube className="mr-2 h-4 w-4" />
                    )}
                    Generate Assessment
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Configure Your Assessment</DialogTitle>
                    <DialogDescription>
                        Choose the number and types of questions for your test.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <div className="space-y-4">
                        <Label>Number of Questions: {questionCount}</Label>
                        <Slider
                            defaultValue={[5]}
                            min={1}
                            max={20}
                            step={1}
                            onValueChange={(value) => setQuestionCount(value[0])}
                        />
                    </div>
                     <div className="space-y-4">
                        <Label>Question Types</Label>
                        <div className="flex flex-col space-y-2">
                             <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="mcq" 
                                    checked={questionTypes.includes('multiple_choice')} 
                                    onCheckedChange={(checked) => handleTypeChange('multiple_choice', !!checked)}
                                />
                                <Label htmlFor="mcq">Multiple Choice</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="tf"
                                    checked={questionTypes.includes('true_false')}
                                    onCheckedChange={(checked) => handleTypeChange('true_false', !!checked)}
                                />
                                <Label htmlFor="tf">True/False</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="sa"
                                    checked={questionTypes.includes('short_answer')}
                                    onCheckedChange={(checked) => handleTypeChange('short_answer', !!checked)}
                                />
                                <Label htmlFor="sa">Short Answer</Label>
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button 
                        onClick={() => onStart({ content: '', questionCount, questionTypes })} 
                        disabled={isLoading || questionTypes.length === 0}
                    >
                         {isLoading ? (
                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        ) : "Start Assessment" }
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function AssessmentDisplay({ assessment }: { assessment: AIAssessment }) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
    const currentQuestion = assessment.questions[currentQuestionIndex];

    const renderQuestion = (question: Question) => {
        switch (question.questionType) {
            case 'multiple_choice':
                return (
                    <RadioGroup>
                        {question.options?.map((option, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <RadioGroupItem value={option} id={`q${currentQuestionIndex}-o${index}`} />
                                <Label htmlFor={`q${currentQuestionIndex}-o${index}`}>{option}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                )
            case 'true_false':
                return (
                     <RadioGroup>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="True" id={`q${currentQuestionIndex}-true`} />
                            <Label htmlFor={`q${currentQuestionIndex}-true`}>True</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <RadioGroupItem value="False" id={`q${currentQuestionIndex}-false`} />
                            <Label htmlFor={`q${currentQuestionIndex}-false`}>False</Label>
                        </div>
                    </RadioGroup>
                )
            case 'short_answer':
                return <textarea className="w-full p-2 border rounded-md" placeholder="Your answer..."/>
            default:
                return <p>Unsupported question type.</p>
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Assessment</CardTitle>
                <CardDescription>Question {currentQuestionIndex + 1} of {assessment.questions.length}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="prose dark:prose-invert max-w-none mb-6">
                    <p>{currentQuestion.questionText}</p>
                </div>
                {renderQuestion(currentQuestion)}
            </CardContent>
             <CardFooter className="flex justify-between">
                <Button 
                    variant="outline"
                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                >
                    Previous
                </Button>
                {currentQuestionIndex < assessment.questions.length - 1 ? (
                     <Button onClick={() => setCurrentQuestionIndex(prev => Math.min(assessment.questions.length - 1, prev + 1))}>
                        Next
                    </Button>
                ) : (
                    <Button>Submit</Button>
                )}
            </CardFooter>
        </Card>
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
    const [formattedDate, setFormattedDate] = React.useState('');

    const materialRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid, 'studyMaterials', params.id);
    }, [firestore, user, params.id]);

    const { data: material, isLoading } = useDoc(materialRef);

    React.useEffect(() => {
        if (material?.uploadDate) {
            // Format date on the client to avoid hydration mismatch
            setFormattedDate(new Date(material.uploadDate).toLocaleDateString());
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

    const handleGenerateAssessment = (config: Omit<GenerateAIAssessmentInput, 'content'>) => {
        if (!material?.extractedText) return;

        startAssessmentTransition(async () => {
            try {
                const assessmentInput: GenerateAIAssessmentInput = {
                    ...config,
                    content: material.extractedText,
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
                        </CardHeader>
                         <CardContent className="grid gap-4 sm:grid-cols-2">
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
                            <AssessmentConfigDialog onStart={handleGenerateAssessment} isLoading={isAssessmentLoading} />
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
                    
                    {studyGuide && !assessment && (
                         <Card>
                            <CardHeader>
                                <CardTitle>AI Generated Study Guide</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <StudyGuideDisplay studyGuide={studyGuide} />
                            </CardContent>
                        </Card>
                    )}

                    {isAssessmentLoading && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Generating Assessment...</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Skeleton className="h-6 w-1/3" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                            </CardContent>
                        </Card>
                    )}

                    {assessment && (
                        <AssessmentDisplay assessment={assessment} />
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
