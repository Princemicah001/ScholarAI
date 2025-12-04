import { DashboardLayout } from "@/components/dashboard-layout";
import { CreateMaterialForm } from "@/components/materials/create-material-form";
import { PageHeader } from "@/components/page-header";

export default function CreateMaterialPage() {
    return (
        <DashboardLayout>
            <PageHeader
                title="Create New Material"
                description="Paste your content below to create a new study material."
            />
            <div className="mt-8 max-w-2xl mx-auto">
                <CreateMaterialForm />
            </div>
        </DashboardLayout>
    )
}
