import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Announcement() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Announcements</h1>
                <p className="text-muted-foreground">
                    View important announcements and updates
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Latest Announcements</CardTitle>
                    <CardDescription>
                        All announcements will appear here
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Announcements content goes here...</p>
                </CardContent>
            </Card>
        </div>
    );
}

Announcement.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Announcements', href: '/announcement' }
    ]}>
        {page}
    </AppLayout>
);