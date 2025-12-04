import { DashboardLayout } from "@/components/dashboard-layout";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// This is a placeholder page. In a real app, you would fetch material data.
async function getMaterial(id: string) {
    console.log("Fetching material for ID:", id)
    return {
        id,
        title: "Placeholder Material Title",
        content: "This is the placeholder content for the study material. In a real application, the full text extracted from the source URL or pasted by the user would appear here. You would then be able to generate study guides and assessments based on this content.",
        createdAt: new Date(),
    }
}


export default async function MaterialPage({ params }: { params: { id: string } }) {
    const material = await getMaterial(params.id);

    return (
        <DashboardLayout>
            <PageHeader 
                title={material.title}
                description={`Created on ${material.createdAt.toLocaleDateString()}`}
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
                                <p>{material.content}</p>
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
