
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Lightbulb } from 'lucide-react';

const affirmations = [
    "Every mistake is a learning opportunity. Embrace the process.",
    "The secret to getting ahead is getting started.",
    "Your only limit is your mind. Believe in yourself.",
    "Today is a new day to learn something amazing.",
    "Focus on progress, not perfection.",
    "The expert in anything was once a beginner.",
    "Learning is a treasure that will follow its owner everywhere.",
    "You are capable of more than you know."
];

export function DailyAffirmation() {
    const [affirmation, setAffirmation] = useState('');

    useEffect(() => {
        // Simple logic to pick a "daily" affirmation.
        // A more robust solution might use the date.
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
        setAffirmation(affirmations[dayOfYear % affirmations.length]);
    }, []);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Daily Affirmation</CardTitle>
                <Lightbulb className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <p className="text-lg font-semibold">"{affirmation}"</p>
            </CardContent>
        </Card>
    );
}
