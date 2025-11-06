import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Mannouncement() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Manage Announcements</h1>
                <p className="text-muted-foreground">
                    Create and manage announcements
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Announcements Management</CardTitle>
                    <CardDescription>
                        Announcement management interface will appear here
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Announcements form goes here...</p>
                </CardContent>
            </Card>
        </div>
    );
}

Mannouncement.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Manage Announcements', href: '/Mannouncement' }
    ]}>
        {page}
    </AppLayout>
);