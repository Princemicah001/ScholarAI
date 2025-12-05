
'use client';

import { useUser, useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { BookPlus, Eye, TrendingUp, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import React from 'react';

const SourceCard = ({ source }: { source: any }) => {
    const [formattedDate, setFormattedDate] = React.useState('');

    React.useEffect(() => {
        if (source.uploadDate) {
            setFormattedDate(new Date(source.uploadDate).toLocaleDateString());
        }
    }, [source.uploadDate]);


    return (
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="truncate">{source.title}</CardTitle>
            <CardDescription>
                {formattedDate ? `Created on ${formattedDate}` : <Skeleton className="h-4 w-24" />}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground line-clamp-3 break-words">
                {source.extractedText}
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="secondary" size="sm">
                <Link href={`/materials/${source.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View
                </Link>
            </Button>
          </CardFooter>
        </Card>
    )
}

const StatsCard = ({ title, value, icon }: { title: string, value: React.ReactNode, icon: React.ReactNode }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
)

export function RecentSources() {
  const { user } = useUser();
  const firestore = useFirestore();

  const sourcesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'studyMaterials'), orderBy('uploadDate', 'desc'), limit(3));
  }, [firestore, user]);

  const testResultsQuery = useMemoFirebase(() => {
      if (!firestore || !user) return null;
      return collection(firestore, 'users', user.uid, 'testResults');
  }, [firestore, user])

  const { data: sources, isLoading: isLoadingSources } = useCollection(sourcesQuery);
  const { data: testResults, isLoading: isLoadingResults } = useCollection(testResultsQuery);

  const averageScore = React.useMemo(() => {
      if (!testResults || testResults.length === 0) return 0;
      const total = testResults.reduce((acc, curr) => acc + curr.score, 0);
      return Math.round(total / testResults.length);
  }, [testResults])

  if (isLoadingSources || isLoadingResults) {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                 <Skeleton className="h-28 w-full" />
                 <Skeleton className="h-28 w-full" />
                 <Skeleton className="h-28 w-full" />
                 <Skeleton className="h-28 w-full" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                    <Skeleton className="h-10 w-full" />
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="h-10 w-24" />
                    </CardFooter>
                </Card>
                ))}
            </div>
      </div>
    )
  }


  if (!sources || sources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted bg-card p-12 text-center">
        <h3 className="text-2xl font-bold tracking-tight">No sources yet</h3>
        <p className="mb-4 text-muted-foreground">
          Get started by creating your first study source.
        </p>
        <Button asChild>
          <Link href="/materials/create">
            <BookPlus className="mr-2 h-4 w-4" />
            Create New Source
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatsCard title="Average Score" value={`${averageScore}%`} icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}/>
            <StatsCard title="Sources Created" value={sources?.length || 0} icon={<BookPlus className="h-4 w-4 text-muted-foreground" />}/>
            <StatsCard title="Tests Taken" value={testResults?.length || 0} icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />} />
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Goals</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">Feature coming soon.</p>
                </CardContent>
            </Card>
        </div>
        <div>
            <h3 className="text-xl font-bold tracking-tight mb-4">Recent Sources</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sources.map((source) => (
                <SourceCard key={source.id} source={source} />
            ))}
            </div>
        </div>
    </div>
  );
}
