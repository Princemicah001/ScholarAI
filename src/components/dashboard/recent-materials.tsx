
'use client';

import { useUser, useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { BookPlus, Eye } from 'lucide-react';
import Link from 'next/link';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import React from 'react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

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

export function RecentSources() {
  const { user } = useUser();
  const firestore = useFirestore();
  const emptyDashboardImage = PlaceHolderImages.find((img) => img.id === 'dashboard-empty');

  const sourcesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'studyMaterials'), orderBy('uploadDate', 'desc'), limit(3));
  }, [firestore, user]);

  const { data: sources, isLoading: isLoadingSources } = useCollection(sourcesQuery);


  if (isLoadingSources) {
    return (
        <div>
            <h3 className="text-xl font-bold tracking-tight mb-4">Recent Sources</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      <div className="text-center rounded-lg border-2 border-dashed border-muted bg-card p-12 flex flex-col items-center">
         {emptyDashboardImage && <Image src={emptyDashboardImage.imageUrl} alt="Empty dashboard" width={200} height={200} className="mb-4 rounded-md" data-ai-hint={emptyDashboardImage.imageHint} />}
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
    <div>
        <h3 className="text-xl font-bold tracking-tight mb-4">Recent Sources</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sources.map((source) => (
            <SourceCard key={source.id} source={source} />
        ))}
        </div>
    </div>
  );
}
