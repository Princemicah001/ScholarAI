
'use client';

import React, { useState, useTransition, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { MessageCircle, X, Sparkles, Send, LoaderCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { cn } from '@/lib/utils';
import { Textarea } from './ui/textarea';
import { askCognify } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';

type Message = {
    role: 'user' | 'model';
    content: string;
};

export function AskCognifyFAB() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setMessages([]);
            setInput('');
        }
    }, [isOpen]);

    useEffect(() => {
        // Scroll to the bottom when a new message is added
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
    }, [messages]);


    const handleSendMessage = () => {
        if (input.trim() === '' || isPending) return;

        const newMessages: Message[] = [...messages, { role: 'user', content: input }];
        setMessages(newMessages);
        const userInput = input;
        setInput('');

        startTransition(async () => {
            const result = await askCognify({
                query: userInput,
                history: newMessages.slice(0, -1), // Send history without the current message
            });

            if (result.error) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: result.error,
                });
                setMessages(prev => prev.slice(0, -1)); // Remove user message if AI fails
            } else if (result.response) {
                setMessages(prev => [...prev, { role: 'model', content: result.response! }]);
            }
        });
    };

    return (
        <>
            <div className={cn(
                "fixed bottom-6 right-6 z-50 transition-transform duration-300 ease-in-out",
                isOpen && "translate-y-24 opacity-0 pointer-events-none"
            )}>
                <Button
                    size="icon"
                    className="rounded-full w-14 h-14 bg-primary hover:bg-primary/90 shadow-lg"
                    onClick={() => setIsOpen(true)}
                    aria-label="Open AI Chat"
                >
                    <Sparkles className="h-6 w-6" />
                </Button>
            </div>

            <div className={cn(
                "fixed bottom-6 right-6 z-50 w-full max-w-sm transition-all duration-300 ease-in-out",
                !isOpen && "translate-y-full opacity-0 pointer-events-none"
            )}>
                <Card className="shadow-2xl">
                    <CardHeader className="flex flex-row items-start justify-between">
                        <div className="space-y-1.5">
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="text-primary" />
                                Ask Cognify
                            </CardTitle>
                            <CardDescription>Your personal AI study assistant.</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)}>
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close Chat</span>
                        </Button>
                    </CardHeader>
                    <CardContent className="h-80 p-0">
                        <ScrollArea className="h-full" ref={scrollAreaRef}>
                            <div className="p-4 space-y-4">
                                {messages.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full text-center pt-16">
                                        <MessageCircle className="h-10 w-10 text-muted-foreground mb-2" />
                                        <p className="text-sm text-muted-foreground">Ask anything about your studies!</p>
                                    </div>
                                )}
                                {messages.map((msg, index) => (
                                    <div key={index} className={cn(
                                        "flex items-start gap-3",
                                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                                    )}>
                                        <div className={cn(
                                            "p-3 rounded-lg max-w-[90%] text-sm",
                                            msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                        )}>
                                            <p className="whitespace-pre-wrap">{msg.content}</p>
                                        </div>
                                    </div>
                                ))}
                                {isPending && (
                                    <div className="flex items-start gap-3 justify-start">
                                        <div className="p-3 rounded-lg bg-muted flex items-center gap-2">
                                            <LoaderCircle className="h-4 w-4 animate-spin" />
                                            <span className="text-sm text-muted-foreground">Cognify is thinking...</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                    <CardFooter className="pt-4 border-t">
                        <div className="relative w-full">
                           <Textarea 
                                placeholder="Type your question..." 
                                className="pr-16"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                disabled={isPending}
                           />
                           <Button 
                                size="icon" 
                                className="absolute top-1/2 right-2 -translate-y-1/2 h-8 w-8"
                                onClick={handleSendMessage}
                                disabled={isPending || input.trim() === ''}
                                aria-label="Send Message"
                           >
                               <Send className="h-4 w-4" />
                           </Button>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </>
    );
}
