
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { SettingsForm } from '@/components/settings/settings-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <PageHeader
        title="Settings"
        description="Manage your account and application preferences."
      />
      <div className="mt-8 grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>Update your personal information.</CardDescription>
                </CardHeader>
                <CardContent>
                    <SettingsForm />
                </CardContent>
            </Card>
        </div>
        <div>
            {/* Future settings cards can go here, e.g., for Notifications, Billing, etc. */}
        </div>
      </div>
    </DashboardLayout>
  );
}
