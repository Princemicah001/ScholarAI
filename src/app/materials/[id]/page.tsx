
'use client';

import React, { useTransition, useState, useEffect } from "react";
import { useDoc, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { setDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { doc, collection } from "firebase/firestore";
import { DashboardLayout } from "@/components/dashboard-layout";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BookOpen, LoaderCircle, TestTube, CheckCircle, XCircle, TimerIcon, Sparkles, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateStudyGuide, generateAssessment, evaluateAssessment } from "@/lib/actions";
import { 
    GenerateStudyGuideOutput, 
    AIAssessment, 
    GenerateAIAssessmentInput, 
    Question, 
    UserAnswer,
    AssessmentEvaluationOutput,
    EvaluationResult,
    StudyGuide,
} from "@/lib/schemas";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";


function StudyGuideDisplay({ studyGuide }: { studyGuide: GenerateStudyGuideOutput }) {
    
    const cleanMnemonic = (text: string) => {
        // This will remove leading list-style asterisks and surrounding bold/italic asterisks
        return text.replace(/^\s*\*\s*/, '').replace(/\*\*/g, '');
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>AI Generated Study Guide</CardTitle>
            </CardHeader>
            <CardContent>
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
                                            <dt className="font-bold">{item.term}</dt>
                                            <dd className="ml-4 mb-2">{item.definition}</dd>
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
                                        <strong className="font-semibold">{item.concept}</strong>
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
                                        <strong className="font-semibold">{item.concept}</strong>
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
                                        <li key={index}>{cleanMnemonic(cue)}</li>
                                    ))}
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                    )}
                </Accordion>
            </CardContent>
        </Card>
    )
}

function AssessmentConfigDialog({ onStart, isLoading }: { onStart: (config: GenerateAIAssessmentInput) => void; isLoading: boolean; }) {
    const [questionCount, setQuestionCount] = React.useState(5);
    const [timer, setTimer] = React.useState(10); // Default 10 minutes
    const [questionTypes, setQuestionTypes] = React.useState<GenerateAIAssessmentInput['questionTypes']>(['multiple_choice']);

    const handleTypeChange = (type: 'multiple_choice' | 'flashcard' | 'short_answer' | 'essay', checked: boolean) => {
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
                                    id="flashcard"
                                    checked={questionTypes.includes('flashcard')}
                                    onCheckedChange={(checked) => handleTypeChange('flashcard', !!checked)}
                                />
                                <Label htmlFor="flashcard">Flashcards</Label>
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
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    const currentQuestion = assessment.questions[currentQuestionIndex];
    const { toast } = useToast();

    useEffect(() => {
        if (assessment.timer && assessment.timer > 0) {
            setTimeLeft(assessment.timer * 60);
        } else {
            setTimeLeft(null); // No timer
        }
    }, [assessment.timer]);

    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) return;

        const intervalId = setInterval(() => {
            setTimeLeft(prevTime => {
                if (prevTime === null) return null;
                const newTime = prevTime - 1;
                if (newTime <= 0) {
                    clearInterval(intervalId);
                    toast({
                        title: "Time's Up!",
                        description: "Your assessment has been automatically submitted.",
                    });
                    onComplete(answers);
                    return 0;
                }
                return newTime;
            });
        }, 1000);

        return () => clearInterval(intervalId);
    }, [timeLeft, onComplete, answers, toast]);


    const formatTime = (seconds: number | null) => {
        if (seconds === null) return null;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };


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
            case 'flashcard':
                return <Textarea placeholder="Your answer (definition/explanation)..." value={userAnswer} onChange={e => handleAnswerChange(e.target.value)} />
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
                     {timeLeft !== null && (
                        <Badge variant="outline" className="text-lg">
                            <TimerIcon className="mr-2 h-5 w-5" />
                            {formatTime(timeLeft)}
                        </Badge>
                     )}
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

function ResultsDisplay({ assessment, evaluation, userAnswers, onRetake, onFinish }: { assessment: AIAssessment, evaluation: AssessmentEvaluationOutput, userAnswers: UserAnswer[], onRetake: () => void, onFinish: () => void }) {
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
                <CardFooter className="flex justify-between">
                    <Button variant="secondary" onClick={onRetake}>Take a New Test</Button>
                    <Button onClick={onFinish}>Back to Study Guide</Button>
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

function StudyGuideConfigDialog({ onStart, isLoading }: { onStart: (useOnline: boolean) => void; isLoading: boolean; }) {
    const [useOnlineSources, setUseOnlineSources] = React.useState(false);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button disabled={isLoading}>
                    {isLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <BookOpen className="mr-2 h-4 w-4" />}
                    Generate Study Guide
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Configure Study Guide</DialogTitle>
                    <DialogDescription>
                        Choose how you want to generate your study guide.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <div className="flex items-center space-x-2">
                        <Switch id="online-sources" checked={useOnlineSources} onCheckedChange={setUseOnlineSources} />
                        <Label htmlFor="online-sources">Enrich with online sources</Label>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                        Allow Cognify to use reliable online sources to provide a more comprehensive guide.
                    </p>
                </div>
                <DialogFooter>
                    <Button onClick={() => onStart(useOnlineSources)} disabled={isLoading}>
                        {isLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : "Generate"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function AskCognify() {
    return (
        <Card className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageCircle />
                    Ask Cognify (Premium)
                </CardTitle>
                <CardDescription className="text-primary-foreground/80">
                    Have a question? Chat with Cognify to get instant clarification on your study material.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Textarea placeholder="Ask a question about your content..." className="text-foreground" />
            </CardContent>
            <CardFooter>
                <Button variant="secondary" className="w-full">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Start Chat
                </Button>
            </CardFooter>
        </Card>
    );
}


export default function MaterialPage({ params }: { params: { id: string } }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isGuideLoading, startGuideTransition] = useTransition();
    const [isAssessmentLoading, startAssessmentTransition] = useTransition();
    const [isEvaluating, startEvaluationTransition] = useTransition();

    const [view, setView] = useState<'guide' | 'assessment' | 'results' | 'loading'>('guide');

    const [studyGuide, setStudyGuide] = useState<StudyGuide | null>(null);
    const [assessment, setAssessment] = useState<AIAssessment | null>(null);
    const [userAnswers, setUserAnswers] = useState<UserAnswer[] | null>(null);
    const [evaluation, setEvaluation] = useState<AssessmentEvaluationOutput | null>(null);
    
    const [formattedDate, setFormattedDate] = useState('');

    const materialRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid, 'studyMaterials', params.id);
    }, [firestore, user, params.id]);

    const { data: material, isLoading: isMaterialLoading } = useDoc(materialRef);

    useEffect(() => {
        if (material?.uploadDate) {
            const date = new Date(material.uploadDate);
            if (!isNaN(date.getTime())) {
                setFormattedDate(date.toLocaleDateString());
            }
        }
        if (material?.studyGuide) {
            setStudyGuide(material.studyGuide);
        }
    }, [material]);

    const handleGenerateStudyGuide = (useOnlineSources: boolean) => {
        if (!material?.extractedText || !user || !materialRef) return;

        startGuideTransition(async () => {
            try {
                const guide = await generateStudyGuide(material.extractedText, useOnlineSources);
                const guideWithId: StudyGuide = { ...guide, id: new Date().toISOString() };
                
                setDocumentNonBlocking(materialRef, { studyGuide: guideWithId }, { merge: true });
                setStudyGuide(guideWithId);

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
                setView('loading');
                const assessmentInput: GenerateAIAssessmentInput = {
                    ...config,
                    content: material.extractedText,
                };
                const generatedAssessment = await generateAssessment(assessmentInput);
                setAssessment(generatedAssessment);
                setView('assessment');
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
                 setView('guide');
            }
        });
    };

    const handleAssessmentComplete = (answers: UserAnswer[]) => {
        if (!assessment || !user || !firestore || !material) return;
        setUserAnswers(answers);
        startEvaluationTransition(async () => {
            try {
                setView('loading');
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
                    assessment, // save the test itself
                    userAnswers: answers, // save the answers
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

                setView('results');
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
                setView('assessment');
            }
        });
    }

    const resetToGuide = () => {
        setAssessment(null);
        setEvaluation(null);
        setUserAnswers(null);
        setView('guide');
    }

    if (isMaterialLoading) {
        return (
            <DashboardLayout>
                <PageHeader
                    title={<Skeleton className="h-8 w-64" />}
                    description={<Skeleton className="h-4 w-48" />}
                />
                 <div className="mt-8 grid gap-8 md:grid-cols-2">
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
                    <Skeleton className="h-64 w-full" />
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

    const renderContent = () => {
        switch (view) {
            case 'assessment':
                if (assessment) return <AssessmentDisplay assessment={assessment} onComplete={handleAssessmentComplete} />;
                return null;
            case 'results':
                if (assessment && evaluation && userAnswers) return <ResultsDisplay assessment={assessment} evaluation={evaluation} userAnswers={userAnswers} onRetake={() => setView('guide')} onFinish={resetToGuide} />;
                return null;
            case 'loading':
                 return (
                    <div className="mt-8 flex flex-col items-center justify-center text-center h-96">
                        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
                        <p className="mt-4 text-muted-foreground">Cognify is working its magic. Please wait a moment.</p>
                    </div>
                );
            case 'guide':
            default:
                return (
                    <div className="mt-8 grid flex-col gap-8 lg:grid-cols-2">
                        <div className="space-y-8">
                             {studyGuide ? (
                                <StudyGuideDisplay studyGuide={studyGuide} />
                            ) : (
                                <OriginalContentDisplay content={material.extractedText} />
                            )}
                        </div>
                        <div className="space-y-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>AI Tools</CardTitle>
                                    <CardDescription>Generate study aids from your source.</CardDescription>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <StudyGuideConfigDialog onStart={handleGenerateStudyGuide} isLoading={isGuideLoading} />
                                    <AssessmentConfigDialog onStart={handleGenerateAssessment} isLoading={isAssessmentLoading} />
                                </CardContent>
                            </Card>
                            <AskCognify />
                        </div>
                    </div>
                );
        }
    }

    return (
        <DashboardLayout>
            <PageHeader
                title={material.title}
                description={formattedDate ? `Created on ${formattedDate}` : ''}
            />
            {renderContent()}
        </DashboardLayout>
    );
}

    