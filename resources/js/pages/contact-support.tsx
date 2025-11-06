import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ContactSupport() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Contact Support</h1>
                <p className="text-muted-foreground">
                    Get help from our support team
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Support</CardTitle>
                    <CardDescription>
                        Contact form will appear here
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Support form goes here...</p>
                </CardContent>
            </Card>
        </div>
    );
}

ContactSupport.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Contact Support', href: '/contact-support' }
    ]}>
        {page}
    </AppLayout>
);