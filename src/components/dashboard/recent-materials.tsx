'use client';

import { useUser, useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { BookPlus, Eye } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { collection } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import React from 'react';

const MaterialCard = ({ material }: { material: any }) => {
    const [formattedDate, setFormattedDate] = React.useState('');

    React.useEffect(() => {
        if (material.uploadDate) {
            // Format date on the client to avoid hydration mismatch
            setFormattedDate(new Date(material.uploadDate).toLocaleDateString());
        }
    }, [material.uploadDate]);


    return (
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="truncate">{material.title}</CardTitle>
            <CardDescription>
                {formattedDate ? `Created on ${formattedDate}` : <Skeleton className="h-4 w-24" />}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground line-clamp-3">
                {material.extractedText}
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="secondary" size="sm">
                <Link href={`/materials/${material.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View
                </Link>
            </Button>
          </CardFooter>
        </Card>
    )
}

export function RecentMaterials() {
  const { user } = useUser();
  const firestore = useFirestore();
  const emptyStateImage = PlaceHolderImages.find(img => img.id === 'dashboard-empty');

  const materialsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'studyMaterials');
  }, [firestore, user]);

  const { data: materials, isLoading } = useCollection(materialsQuery);

  if (isLoading) {
    return (
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
    )
  }


  if (!materials || materials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted bg-card p-12 text-center">
        {emptyStateImage && (
             <Image
                src={emptyStateImage.imageUrl}
                width={300}
                height={200}
                alt="No materials yet"
                data-ai-hint={emptyStateImage.imageHint}
                className="mb-8 rounded-md"
            />
        )}
        <h3 className="text-2xl font-bold tracking-tight">No materials yet</h3>
        <p className="mb-4 text-muted-foreground">
          Get started by creating your first study material.
        </p>
        <Button asChild>
          <Link href="/materials/create">
            <BookPlus className="mr-2 h-4 w-4" />
            Create New Material
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {materials.map((material) => (
        <MaterialCard key={material.id} material={material} />
      ))}
    </div>
  );
}
