import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ManageEvents() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Manage Events</h1>
                <p className="text-muted-foreground">
                    Create and manage events
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Events Management</CardTitle>
                    <CardDescription>
                        Event management interface will appear here
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Events table goes here...</p>
                </CardContent>
            </Card>
        </div>
    );
}

ManageEvents.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Manage Events', href: '/manageevents' }
    ]}>
        {page}
    </AppLayout>
);