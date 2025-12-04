'use client';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookPlus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function RecentMaterials() {
  const { user } = useAuth();
  // In a real app, you would fetch recent materials for the user here.
  const materials: any[] = [];
  const emptyStateImage = PlaceHolderImages.find(img => img.id === 'dashboard-empty');


  if (materials.length === 0) {
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
        <Card key={material.id}>
          <CardHeader>
            <CardTitle>{material.title}</CardTitle>
            <CardDescription>{material.description}</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
