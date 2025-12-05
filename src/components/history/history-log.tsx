
'use client';

import React from 'react';
import { useUser, useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookCopy, FileText, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function HistoryItem({ event }: { event: any }) {
    const getIcon = () => {
        switch (event.type) {
            case 'source_created':
                return <BookCopy className="h-5 w-5 text-primary" />;
            case 'test_taken':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            default:
                return <FileText className="h-5 w-5 text-muted-foreground" />;
        }
    };

    const getDescription = () => {
        switch (event.type) {
            case 'source_created':
                return `You created a new source: "${event.title}"`;
            case 'test_taken':
                return `You completed a test for "${event.sourceTitle}" with a score of ${event.score}%.`;
            default:
                return 'An unknown event occurred.';
        }
    }

    return (
        <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
                {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{getDescription()}</p>
                <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(event.date), { addSuffix: true })}
                </p>
            </div>
        </div>
    );
}


export function HistoryLog() {
    const { user } = useUser();
    const firestore = useFirestore();

    const sourcesQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'users', user.uid, 'studyMaterials'), orderBy('uploadDate', 'desc'));
    }, [firestore, user]);

    const testResultsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'users', user.uid, 'testResults'), orderBy('completionDate', 'desc'));
    }, [firestore, user]);
    
    const { data: sources, isLoading: isLoadingSources } = useCollection(sourcesQuery);
    const { data: testResults, isLoading: isLoadingResults } = useCollection(testResultsQuery);
    const { data: tests, isLoading: isLoadingTests } = useCollection(useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'tests') : null, [user, firestore]));


    const combinedHistory = React.useMemo(() => {
        if (!sources || !testResults || !tests) return [];

        const sourceEvents = sources.map(s => ({
            id: s.id,
            type: 'source_created',
            title: s.title,
            date: s.uploadDate,
        }));

        const testEvents = testResults.map(tr => {
            const source = sources.find(s => s.id === tr.studyMaterialId);
            return {
                id: tr.id,
                type: 'test_taken',
                sourceTitle: source?.title || 'a source',
                score: tr.score,
                date: tr.completionDate,
            };
        });

        return [...sourceEvents, ...testEvents].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    }, [sources, testResults, tests]);

    if (isLoadingSources || isLoadingResults || isLoadingTests) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-64" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        )
    }

    if (combinedHistory.length === 0) {
        return (
            <div className="text-center p-8 border-2 border-dashed rounded-lg">
                <h3 className="text-xl font-semibold">No History Yet</h3>
                <p className="text-muted-foreground">Create a source or take a test to start building your activity log.</p>
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>A log of your interactions with Cognify.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {combinedHistory.map((event) => (
                        <HistoryItem key={`${event.type}-${event.id}`} event={event} />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
