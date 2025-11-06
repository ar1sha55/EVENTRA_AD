import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';

export default function Profile() {
    const { auth } = usePage<SharedData>().props;
    
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Manage Profile</h1>
                <p className="text-muted-foreground">
                    Update your profile information
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                        Your personal information
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Name</label>
                            <p className="text-sm text-muted-foreground">{auth.user.name}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Email</label>
                            <p className="text-sm text-muted-foreground">{auth.user.email}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">Profile form will go here...</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

Profile.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Profile', href: '/profile' }
    ]}>
        {page}
    </AppLayout>
);