
import { DashboardLayout } from '@/components/dashboard-layout';
import { RecentSources } from '@/components/dashboard/recent-materials';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { BookPlus } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here are your recent sources."
      >
        <Button asChild>
          <Link href="/materials/create">
            <BookPlus className="mr-2 h-4 w-4" />
            New Source
          </Link>
        </Button>
      </PageHeader>
      <div className="mt-8">
        <RecentSources />
      </div>
    </DashboardLayout>
  );
}
