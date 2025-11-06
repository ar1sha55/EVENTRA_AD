import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ManageAnalytics() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Analytics & Reports</h1>
                <p className="text-muted-foreground">
                    View event analytics and generate reports
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Analytics Dashboard</CardTitle>
                    <CardDescription>
                        Charts and reports will appear here
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Analytics charts go here...</p>
                </CardContent>
            </Card>
        </div>
    );
}

ManageAnalytics.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Analytics & Reports', href: '/manageanalytics' }
    ]}>
        {page}
    </AppLayout>
);