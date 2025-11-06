import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function QrScanner() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Scan Attendance</h1>
                <p className="text-muted-foreground">
                    Scan QR codes to mark attendance
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>QR Scanner</CardTitle>
                    <CardDescription>
                        QR code scanner will appear here
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Scanner component goes here...</p>
                </CardContent>
            </Card>
        </div>
    );
}

QrScanner.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'QR Scanner', href: '/qr-scanner' }
    ]}>
        {page}
    </AppLayout>
);