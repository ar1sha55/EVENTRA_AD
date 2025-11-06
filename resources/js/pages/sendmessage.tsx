import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SendMessage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Send Message</h1>
                <p className="text-muted-foreground">
                    Send messages to members
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Compose Message</CardTitle>
                    <CardDescription>
                        Message composition form will appear here
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Message form goes here...</p>
                </CardContent>
            </Card>
        </div>
    );
}

SendMessage.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Send Message', href: '/sendmessage' }
    ]}>
        {page}
    </AppLayout>
);