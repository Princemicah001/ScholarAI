
import { DashboardLayout } from '@/components/dashboard-layout';
import { HistoryLog } from '@/components/history/history-log';
import { PageHeader } from '@/components/page-header';

export default function HistoryPage() {
  return (
    <DashboardLayout>
      <PageHeader
        title="Activity History"
        description="Review your recent study sessions and created materials."
      />
      <div className="mt-8">
        <HistoryLog />
      </div>
    </DashboardLayout>
  );
}
