
'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { MessageCircle, X, Sparkles, Send } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { cn } from '@/lib/utils';
import { Textarea } from './ui/textarea';

export function AskCognifyFAB() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'bot', content: string }[]>([]);
    const [input, setInput] = useState('');

    const handleSendMessage = () => {
        if (input.trim() === '') return;
        setMessages(prev => [...prev, { role: 'user', content: input }]);
        // Placeholder for AI response
        setTimeout(() => {
            setMessages(prev => [...prev, { role: 'bot', content: "This is a placeholder response from Cognify. This feature is coming soon!" }]);
        }, 1000);
        setInput('');
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
                >
                    <MessageCircle className="h-6 w-6" />
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
                        </Button>
                    </CardHeader>
                    <CardContent className="h-80 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={cn(
                                "flex items-start gap-3",
                                msg.role === 'user' ? 'justify-end' : 'justify-start'
                            )}>
                                <div className={cn(
                                    "p-3 rounded-lg max-w-xs",
                                    msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                )}>
                                    <p className="text-sm">{msg.content}</p>
                                </div>
                            </div>
                        ))}
                         {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <MessageCircle className="h-10 w-10 text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">Ask anything about your study materials!</p>
                            </div>
                        )}
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
                           />
                           <Button 
                                size="icon" 
                                className="absolute top-1/2 right-2 -translate-y-1/2 h-8 w-8"
                                onClick={handleSendMessage}
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
