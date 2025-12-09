
'use client';
import { DashboardLayout } from '@/components/dashboard-layout';
import { AllSources } from '@/components/dashboard/recent-materials';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { BookPlus } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { DailyAffirmation } from '@/components/dashboard/daily-affirmation';
import { ProgressOverview } from '@/components/dashboard/progress-overview';

export default function DashboardPage() {
  const { user } = useUser();

  return (
    <DashboardLayout>
      <PageHeader
        title={`Welcome back, ${user?.displayName?.split(' ')[0] || 'Scholar'}!`}
        description="Let's make today a productive day. Seize the opportunity to learn something new."
      >
        <Button asChild>
          <Link href="/materials/create">
            <BookPlus className="mr-2 h-4 w-4" />
            New Source
          </Link>
        </Button>
      </PageHeader>
      <div className="mt-8 space-y-8">
        <DailyAffirmation />
        <ProgressOverview />
        <AllSources />
      </div>
    </DashboardLayout>
  );
}
