import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <DashboardLayout>
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here are your recent study materials."
      >
        <Skeleton className="h-10 w-36" />
      </PageHeader>
      <div className="mt-8">
        <Skeleton className="h-48 w-full" />
      </div>
    </DashboardLayout>
  );
}
