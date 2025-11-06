import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function EventsGalleria() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Events Galleria</h1>
                <p className="text-muted-foreground">
                    View photos and media from past events
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Gallery</CardTitle>
                    <CardDescription>
                        Event photos and media will appear here
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Gallery content goes here...</p>
                </CardContent>
            </Card>
        </div>
    );
}

EventsGalleria.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Events Galleria', href: '/events-galleria' }
    ]}>
        {page}
    </AppLayout>
);