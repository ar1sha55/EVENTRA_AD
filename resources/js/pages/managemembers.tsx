import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ManageMembers() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Manage Members</h1>
                <p className="text-muted-foreground">
                    View and manage club members
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Members List</CardTitle>
                    <CardDescription>
                        Member management interface will appear here
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Members table goes here...</p>
                </CardContent>
            </Card>
        </div>
    );
}

ManageMembers.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Manage Members', href: '/managemembers' }
    ]}>
        {page}
    </AppLayout>
);