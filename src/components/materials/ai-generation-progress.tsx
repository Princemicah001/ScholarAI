
'use client';

import { useState, useEffect } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface AIGenerationProgressProps {
    estimatedDuration: number; // in seconds
    taskDescription: string;
}

export function AIGenerationProgress({ estimatedDuration, taskDescription }: AIGenerationProgressProps) {
    const [progress, setProgress] = useState(0);
    const [timeLeft, setTimeLeft] = useState(estimatedDuration);

    useEffect(() => {
        // Animate the progress bar
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 95) {
                    clearInterval(progressInterval);
                    return 95; // Don't complete to 100, let the final state do that
                }
                // Animate faster at the beginning, slower at the end
                const increment = (100 - prev) / (estimatedDuration * 2);
                return prev + increment;
            });
        }, 100);

        // Countdown timer
        const timerInterval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerInterval);
                    return 1; // Keep it at 1 second until it's done
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearInterval(progressInterval);
            clearInterval(timerInterval);
        };
    }, [estimatedDuration]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins > 0) return `${mins}m ${secs}s`;
        return `${secs}s`;
    };

    return (
        <div className="mt-8 flex flex-col items-center justify-center text-center h-96 w-full max-w-md mx-auto">
            <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
            <h2 className="mt-4 text-xl font-semibold">
                {taskDescription}
            </h2>
            <p className="mt-2 text-muted-foreground">
                Cognify is working its magic. This should take about {formatTime(timeLeft)}...
            </p>
            <Progress value={progress} className="w-full mt-6" />
        </div>
    );
}
