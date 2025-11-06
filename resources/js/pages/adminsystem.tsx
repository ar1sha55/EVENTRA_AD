import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminSystem() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">System Control</h1>
                <p className="text-muted-foreground">
                    Manage system settings and configurations
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Admin Panel</CardTitle>
                    <CardDescription>
                        System controls and settings will appear here
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Admin controls go here...</p>
                </CardContent>
            </Card>
        </div>
    );
}

AdminSystem.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'System Control', href: '/adminsystem' }
    ]}>
        {page}
    </AppLayout>
);