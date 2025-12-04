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
            setFormattedDate(new Date(material.uploadDate).toLocaleDateString());
        }
    }, [material?.uploadDate]);

    if (isLoading) {
        return (
            <DashboardLayout>
                <PageHeader 
                    title={<Skeleton className="h-8 w-64" />}
                    description={<Skeleton className="h-4 w-48" />}
                />
                 <div className="mt-8 grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2">
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
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>AI Tools</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                               <Skeleton className="h-6 w-full" />
                            </CardContent>
                        </Card>
                    </div>
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
                description={formattedDate ? `Created on ${formattedDate}` : <Skeleton className="h-4 w-32" />}
            >
                {/* Action buttons (e.g., Generate Assessment) will go here */}
            </PageHeader>

            <div className="mt-8 grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Original Content</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose dark:prose-invert max-w-none">
                                <p>{material.extractedText}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>AI Tools</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground text-sm">
                                Generate study guides and assessments from your material.
                            </p>
                            {/* Study Guide and Assessment components will go here */}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
