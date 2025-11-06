import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Events() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Join Events</h1>
                <p className="text-muted-foreground">
                    Browse and join upcoming events
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Events</CardTitle>
                    <CardDescription>
                        List of available events will appear here
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Content goes here...</p>
                </CardContent>
            </Card>
        </div>
    );
}

Events.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Events', href: '/events' }
    ]}>
        {page}
    </AppLayout>
);