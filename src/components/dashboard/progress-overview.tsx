
'use client';

import React from 'react';
import { useUser, useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { BookCopy, CheckCircle, TrendingUp, BarChart as BarChartIcon } from 'lucide-react';
import { subDays, format } from 'date-fns';

const chartConfig = {
    score: {
        label: 'Score',
        color: 'hsl(var(--primary))',
    },
};

export function ProgressOverview() {
    const { user } = useUser();
    const firestore = useFirestore();

    const sourcesQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'users', user.uid, 'studyMaterials'));
    }, [firestore, user]);

    const testResultsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'users', user.uid, 'testResults'), orderBy('completionDate', 'desc'));
    }, [firestore, user]);

    const { data: sources, isLoading: isLoadingSources } = useCollection(sourcesQuery);
    const { data: testResults, isLoading: isLoadingResults } = useCollection(testResultsQuery);

    const chartData = React.useMemo(() => {
        if (!testResults) return [];
        const last7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), i)).reverse();
        
        const data = last7Days.map(day => {
            const dayString = format(day, 'MMM d');
            const scoresOnDay = testResults.filter(tr => format(new Date(tr.completionDate), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));
            const averageScore = scoresOnDay.length > 0 ? scoresOnDay.reduce((acc, curr) => acc + curr.score, 0) / scoresOnDay.length : 0;
            return { date: dayString, score: Math.round(averageScore) };
        });

        // Ensure there is at least one non-zero score to make the chart visible
        const hasScores = data.some(d => d.score > 0);
        if (!hasScores && testResults.length > 0) {
            // If no scores in the last 7 days, show the most recent score
            const mostRecentTest = testResults[0];
            return [{
                date: format(new Date(mostRecentTest.completionDate), 'MMM d'),
                score: Math.round(mostRecentTest.score)
            }];
        }

        return data;
    }, [testResults]);

    const averageScore = React.useMemo(() => {
        if (!testResults || testResults.length === 0) return 0;
        const total = testResults.reduce((acc, curr) => acc + curr.score, 0);
        return Math.round(total / testResults.length);
    }, [testResults]);


    if (isLoadingSources || isLoadingResults) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36" />)}
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{averageScore}%</div>
                    <p className="text-xs text-muted-foreground">Across all tests taken</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sources Created</CardTitle>
                    <BookCopy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{sources?.length || 0}</div>
                    <p className="text-xs text-muted-foreground">Total study materials</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tests Taken</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{testResults?.length || 0}</div>
                     <p className="text-xs text-muted-foreground">Assessments completed</p>
                </CardContent>
            </Card>
             <Card className="lg:col-span-2 xl:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Recent Performance</CardTitle>
                    <BarChartIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="pb-0">
                    {chartData.length > 0 && chartData.some(d => d.score > 0) ? (
                        <ChartContainer config={chartConfig} className="h-[100px] w-full">
                           <AreaChart accessibilityLayer data={chartData}>
                                <defs>
                                    <linearGradient id="fillScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop
                                        offset="5%"
                                        stopColor="var(--color-score)"
                                        stopOpacity={0.8}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="var(--color-score)"
                                        stopOpacity={0.1}
                                    />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, 3)} />
                                <ChartTooltipContent />
                                <Area type="monotone" dataKey="score" stroke="var(--color-score)" strokeWidth={2} fill="url(#fillScore)" />
                            </AreaChart>
                        </ChartContainer>
                    ) : (
                         <div className="flex flex-col items-center justify-center h-[100px] text-center">
                            <p className="text-sm text-muted-foreground">Take a test to see your progress.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
