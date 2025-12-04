'use client';

import { DashboardLayout } from "@/components/dashboard-layout";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDoc, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

export default function MaterialPage({ params }: { params: { id: string } }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const [formattedDate, setFormattedDate] = React.useState('');

    const materialRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid, 'studyMaterials', params.id);
    }, [firestore, user, params.id]);

    const { data: material, isLoading } = useDoc(materialRef);

    React.useEffect(() => {
        if (material?.uploadDate) {
            const date = new Date(material.uploadDate);
            if (!isNaN(date.getTime())) {
                setFormattedDate(date.toLocaleDateString());
            }
        }
    }, [material?.uploadDate]);

    if (isLoading) {
        return (
            <DashboardLayout>
                <PageHeader 
                    title={<Skeleton className="h-8 w-64" />}
                    description={<Skeleton className="h-4 w-48" />}
                />
                 <div className="mt-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Original Content</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        )
    }

    if (!material) {
        return (
            <DashboardLayout>
                <PageHeader 
                    title="Material not found"
                    description="Could not find the requested study material."
                />
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <PageHeader 
                title={material.title}
                description={formattedDate ? `Created on ${formattedDate}` : ''}
            />
            <div className="mt-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Original Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="prose dark:prose-invert max-w-none">
                            <p className="whitespace-pre-wrap">{material.extractedText}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
