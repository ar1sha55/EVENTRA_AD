import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { Head, router } from "@inertiajs/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Database, Users, Shield, BarChart3 } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "System Controls",
    href: "/admin/system-control",
  },
];

export default function SystemControls() {
  // Mock system statistics
  const userStats = [
    { role: "Admins", count: 3 },
    { role: "Managers", count: 5 },
    { role: "Members", count: 40 },
  ];

  const eventStats = [
    { name: "Active", value: 4 },
    { name: "Past", value: 12 },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="System Controls" />

      <div className="flex flex-col gap-6 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl font-semibold">System Controls</h1>
          </div>
        </div>

        {/* System Overview (Charts) */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                User Role Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userStats}>
                  <XAxis dataKey="role" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                Events Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eventStats}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* System Control Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-4">
          {/* Manage Users */}
          <Card className="transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                Manage Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Add, edit, or remove user accounts and manage their roles.
              </p>
              <Button
                className="w-full"
                onClick={() => router.get("/admin/manage-users")}
              >
                Go to User Management
              </Button>
            </CardContent>
          </Card>

          {/* System Data */}
          <Card className="transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-muted-foreground" />
                System Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Backup or restore important data for your application.
              </p>
              <Button
                className="w-full"
                onClick={() => router.get("/admin/system-data")}
              >
                Open Data Controls
              </Button>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-muted-foreground" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Manage admin privileges and access restrictions.
              </p>
              <Button
                className="w-full"
                onClick={() => router.get("/admin/security-settings")}
              >
                Review Security
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
