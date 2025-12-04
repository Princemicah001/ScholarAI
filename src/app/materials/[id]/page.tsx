
'use client';

import React, { useTransition, useState, useEffect } from "react";
import { useDoc, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { doc, collection } from "firebase/firestore";
import { DashboardLayout } from "@/components/dashboard-layout";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BookOpen, LoaderCircle, TestTube, CheckCircle, XCircle, TimerIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateStudyGuide, generateAssessment, evaluateAssessment } from "@/lib/actions";
import { 
    GenerateStudyGuideOutput, 
    AIAssessment, 
    GenerateAIAssessmentInput, 
    Question, 
    UserAnswer,
    AssessmentEvaluationOutput,
    EvaluationResult
} from "@/lib/schemas";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";


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
    const [timer, setTimer] = React.useState(10); // Default 10 minutes
    const [questionTypes, setQuestionTypes] = React.useState<GenerateAIAssessmentInput['questionTypes']>(['multiple_choice']);

    const handleTypeChange = (type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay', checked: boolean) => {
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
                        Choose the number, types of questions, and time limit for your test.
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
                        <Label>Time Limit (minutes): {timer === 0 ? 'No limit' : `${timer}`}</Label>
                        <Slider
                            defaultValue={[10]}
                            min={0}
                            max={120}
                            step={5}
                            onValueChange={(value) => setTimer(value[0])}
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
                             <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="essay"
                                    checked={questionTypes.includes('essay')}
                                    onCheckedChange={(checked) => handleTypeChange('essay', !!checked)}
                                />
                                <Label htmlFor="essay">Essay</Label>
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button 
                        onClick={() => onStart({ content: '', questionCount, questionTypes, timer })} 
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

function AssessmentDisplay({ assessment, onComplete }: { assessment: AIAssessment, onComplete: (answers: UserAnswer[]) => void }) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<UserAnswer[]>([]);
    const currentQuestion = assessment.questions[currentQuestionIndex];

    const handleAnswerChange = (answer: string) => {
        const newAnswers = [...answers];
        const existingAnswerIndex = newAnswers.findIndex(a => a.questionIndex === currentQuestionIndex);
        if (existingAnswerIndex > -1) {
            newAnswers[existingAnswerIndex].answer = answer;
        } else {
            newAnswers.push({ questionIndex: currentQuestionIndex, answer });
        }
        setAnswers(newAnswers);
    };

    const renderQuestion = (question: Question) => {
        const userAnswer = answers.find(a => a.questionIndex === currentQuestionIndex)?.answer || '';
        switch (question.questionType) {
            case 'multiple_choice':
                return (
                    <RadioGroup onValueChange={handleAnswerChange} value={userAnswer}>
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
                     <RadioGroup onValueChange={handleAnswerChange} value={userAnswer}>
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
                return <Textarea placeholder="Your answer..." value={userAnswer} onChange={e => handleAnswerChange(e.target.value)} />
            case 'essay':
                return <Textarea className="min-h-[200px]" placeholder="Your essay response..." value={userAnswer} onChange={e => handleAnswerChange(e.target.value)} />
            default:
                return <p>Unsupported question type.</p>
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Assessment</CardTitle>
                        <CardDescription>Question {currentQuestionIndex + 1} of {assessment.questions.length}</CardDescription>
                    </div>
                     {/* Timer could go here */}
                </div>
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
                    <Button onClick={() => onComplete(answers)}>Submit</Button>
                )}
            </CardFooter>
        </Card>
    )
}

const getHighlightColor = (highlight: 'green' | 'orange' | 'grey' | 'none') => {
  switch (highlight) {
    case 'green': return 'bg-green-200 dark:bg-green-900';
    case 'orange': return 'bg-orange-200 dark:bg-orange-900';
    case 'grey': return 'bg-slate-300 dark:bg-slate-700';
    default: return '';
  }
};

function ResultsDisplay({ assessment, evaluation, userAnswers }: { assessment: AIAssessment, evaluation: AssessmentEvaluationOutput, userAnswers: UserAnswer[] }) {
    const router = useRouter();

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Assessment Results</CardTitle>
                    <CardDescription>Here's how you performed.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="flex flex-col items-center justify-center space-y-2 rounded-lg bg-secondary p-6">
                        <div className="text-6xl font-bold">{Math.round(evaluation.overallScore)}%</div>
                        <div className="text-muted-foreground">Overall Score</div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold">Strengths</h3>
                            <p className="text-sm text-muted-foreground">{evaluation.strengthSummary}</p>
                        </div>
                         <div>
                            <h3 className="font-semibold">Areas for Improvement</h3>
                            <p className="text-sm text-muted-foreground">{evaluation.weaknessAnalysis}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Question Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                    <Accordion type="multiple" className="w-full">
                        {assessment.questions.map((question, index) => {
                            const result = evaluation.results.find(r => r.questionIndex === index);
                            const userAnswer = userAnswers.find(a => a.questionIndex === index);

                            if (!result) return null;
                            
                            const isCorrect = result.isCorrect;

                            return (
                                <AccordionItem key={index} value={`item-${index}`}>
                                    <AccordionTrigger>
                                        <div className="flex items-center gap-2">
                                            {isCorrect ? <CheckCircle className="h-5 w-5 text-green-500"/> : <XCircle className="h-5 w-5 text-red-500" />}
                                            <span>Question {index + 1}: {question.questionType.replace('_', ' ')}</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="prose dark:prose-invert max-w-none space-y-4">
                                        <p><strong>Your answer:</strong> {userAnswer?.answer || "Not Answered"}</p>
                                        
                                        {question.questionType === 'essay' && result.essayEvaluation ? (
                                            <div>
                                                <strong>Evaluated Essay:</strong>
                                                <div className="mt-2 rounded-md border p-4">
                                                    <p>
                                                        {result.essayEvaluation.highlightedText.map((segment, i) => (
                                                            <span key={i} className={cn('px-1', getHighlightColor(segment.highlight))}>{segment.text}</span>
                                                        ))}
                                                    </p>
                                                </div>
                                                <div className="mt-4">
                                                    <strong className="text-yellow-600 dark:text-yellow-400">Corrections:</strong>
                                                    <ul className="list-disc pl-5">
                                                        {result.essayEvaluation.corrections.map((correction, i) => <li key={i}>{correction}</li>)}
                                                    </ul>
                                                </div>
                                                <div className="mt-4">
                                                    <strong className="text-blue-600 dark:text-blue-400">Alternative Approaches:</strong>
                                                    {result.essayEvaluation.alternativeAnswers.map((alt, i) => (
                                                        <div key={i} className="mt-2">
                                                            <p><strong>{alt.title}</strong></p>
                                                            <p>{alt.content}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <strong>Feedback:</strong>
                                                <p>{result.feedback}</p>
                                            </div>
                                        )}

                                    </AccordionContent>
                                </AccordionItem>
                            )
                        })}
                    </Accordion>
                </CardContent>
                <CardFooter>
                    <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
                </CardFooter>
            </Card>
        </div>
    )
}

function OriginalContentDisplay({ content }: { content: string }) {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
        <Card>
            <CardHeader>
                <CardTitle>Original Content</CardTitle>
            </CardHeader>
            <CardContent>
                <div className={cn("prose dark:prose-invert max-w-none relative", !isExpanded && "max-h-48 overflow-hidden")}>
                    <p className="whitespace-pre-wrap">{content}</p>
                    {!isExpanded && (
                        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-card to-transparent" />
                    )}
                </div>
            </CardContent>
            <CardFooter>
                <Button variant="secondary" onClick={() => setIsExpanded(!isExpanded)}>
                    {isExpanded ? 'Read Less' : 'Read More'}
                </Button>
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
    const [isEvaluating, startEvaluationTransition] = useTransition();

    const [studyGuide, setStudyGuide] = useState<GenerateStudyGuideOutput | null>(null);
    const [assessment, setAssessment] = useState<AIAssessment | null>(null);
    const [userAnswers, setUserAnswers] = useState<UserAnswer[] | null>(null);
    const [evaluation, setEvaluation] = useState<AssessmentEvaluationOutput | null>(null);
    
    const [formattedDate, setFormattedDate] = useState('');

    const materialRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid, 'studyMaterials', params.id);
    }, [firestore, user, params.id]);

    const { data: material, isLoading } = useDoc(materialRef);

    useEffect(() => {
        if (material?.uploadDate) {
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
                setStudyGuide(null); // Hide study guide when assessment starts
                setEvaluation(null);
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

    const handleAssessmentComplete = (answers: UserAnswer[]) => {
        if (!assessment || !user || !firestore || !material) return;
        setUserAnswers(answers);
        startEvaluationTransition(async () => {
            try {
                const result = await evaluateAssessment({ assessment, userAnswers: answers });
                setEvaluation(result);
                
                const newTestRef = await addDocumentNonBlocking(collection(firestore, `users/${user.uid}/tests`), {
                    userId: user.uid,
                    studyMaterialId: material.id,
                    testType: "Mixed",
                    questionCount: assessment.questions.length,
                    timer: assessment.timer || 0,
                    passingScore: 70, 
                    creationDate: new Date().toISOString(),
                });

                await addDocumentNonBlocking(collection(firestore, `users/${user.uid}/testResults`), {
                    testId: newTestRef.id,
                    userId: user.uid,
                    studyMaterialId: material.id,
                    score: result.overallScore,
                    completionDate: new Date().toISOString(),
                    performanceSummary: `Strengths: ${result.strengthSummary}. Weaknesses: ${result.weaknessAnalysis}`,
                    recommendations: "Review the feedback provided for incorrect answers."
                });

                toast({
                    title: "Assessment Evaluated",
                    description: "Check out your results below.",
                });

            } catch (error: any) {
                 toast({
                    variant: "destructive",
                    title: "Evaluation Failed",
                    description: error.message || "Could not evaluate your assessment.",
                });
            }
        });
    }

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
                    title="Source not found"
                    description="Could not find the requested study source."
                />
            </DashboardLayout>
        )
    }

    if (isEvaluating) {
        return (
            <DashboardLayout>
                <PageHeader title="Evaluating Assessment..." />
                <div className="mt-8 flex flex-col items-center justify-center text-center">
                    <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
                    <p className="mt-4 text-muted-foreground">Your results are being analyzed by ScholarAI. Please wait a moment.</p>
                </div>
            </DashboardLayout>
        );
    }
    
    if (evaluation && assessment && userAnswers) {
         return (
            <DashboardLayout>
                <PageHeader
                    title={`${material.title} - Results`}
                />
                <div className="mt-8 max-w-4xl mx-auto">
                    <ResultsDisplay assessment={assessment} evaluation={evaluation} userAnswers={userAnswers} />
                </div>
            </DashboardLayout>
        )
    }

    if (assessment) {
        return (
            <DashboardLayout>
                <PageHeader
                    title={`${material.title} - Assessment`}
                />
                <div className="mt-8 max-w-4xl mx-auto">
                    <AssessmentDisplay assessment={assessment} onComplete={handleAssessmentComplete} />
                </div>
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
                <OriginalContentDisplay content={material.extractedText} />

                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>AI Tools</CardTitle>
                            <CardDescription>Generate study aids from your source.</CardDescription>
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
                </div>
            </div>
        </DashboardLayout>
    );
}
