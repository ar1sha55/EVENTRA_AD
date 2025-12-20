import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Construction } from 'lucide-react';

export default function AdminDashboard() {
    return (
        <AppLayout>
            <div className="container mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Shield className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                        <p className="text-muted-foreground">
                            System-wide overview and administration
                        </p>
                    </div>
                </div>

                {/* Placeholder Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Construction className="h-5 w-5 text-muted-foreground" />
                            <CardTitle>Under Construction</CardTitle>
                        </div>
                        <CardDescription>
                            This dashboard is currently being developed
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12 space-y-4">
                            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                                <Shield className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Admin Dashboard Coming Soon</h3>
                                <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
                                    This dashboard will provide system-wide statistics, user management overview,
                                    platform health metrics, and administrative controls.
                                </p>
                            </div>
                            <div className="pt-4">
                                <p className="text-xs text-muted-foreground">
                                    Expected features: System stats • User analytics • Platform metrics • Activity overview
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
