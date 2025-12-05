import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bell, Calendar, CalendarDays, CheckCircle, Clock, Award, User, Trash2, Check, MailX } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Notifications',
    href: '/notifications',
  },
];

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data: {
    event_id?: number;
    event_name?: string;
    start_date?: string;
    user_id?: number;
    user_name?: string;
    handled?: boolean;
    handled_status?: string;
    handled_at?: string;
    handled_by?: string;
  };
  read_at: string | null;
  created_at: string;
}

interface PaginationLinks {
  url: string | null;
  label: string;
  active: boolean;
}

interface NotificationsProps {
  notifications: {
    data: Notification[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLinks[];
  };
}

export default function Notifications({ notifications }: NotificationsProps) {
  const [localNotifications, setLocalNotifications] = useState(notifications.data);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'event_upcoming': return { icon: Calendar, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
      case 'event_new': return { icon: CalendarDays, color: 'text-blue-600 bg-blue-50 border-blue-200' };
      case 'registration_approved': return { icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-200' };
      case 'registration_rejected': return { icon: Bell, color: 'text-red-600 bg-red-50 border-red-200' };
      case 'ranking_update': return { icon: Award, color: 'text-purple-600 bg-purple-50 border-purple-200' };
      case 'registration_pending': return { icon: Clock, color: 'text-orange-600 bg-orange-50 border-orange-200' };
      case 'new_registration': return { icon: User, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' };
      case 'manager_approved_registration': return { icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-200' };
      case 'manager_rejected_registration': return { icon: Bell, color: 'text-red-600 bg-red-50 border-red-200' };
      default: return { icon: Bell, color: 'text-gray-600 bg-gray-50 border-gray-200' };
    }
  };

  const getNotificationBadge = (type: string) => {
    const badges = {
      event_upcoming: { label: 'Upcoming', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      event_new: { label: 'New Event', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      registration_approved: { label: 'Approved', color: 'bg-green-100 text-green-800 border-green-200' },
      registration_rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800 border-red-200' },
      ranking_update: { label: 'Ranking', color: 'bg-purple-100 text-purple-800 border-purple-200' },
      registration_pending: { label: 'Pending', color: 'bg-orange-100 text-orange-800 border-orange-200' },
      new_registration: { label: 'New Member', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
      manager_approved_registration: { label: 'Action Confirmed', color: 'bg-green-100 text-green-800 border-green-200' },
      manager_rejected_registration: { label: 'Action Confirmed', color: 'bg-red-100 text-red-800 border-red-200' },
    };
    return badges[type as keyof typeof badges] || { label: 'Info', color: 'bg-gray-100 text-gray-800 border-gray-200' };
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read_at) {
      markAsRead(notification.id);
    }

    if (notification.data.event_id) {
      // For manager-specific action confirmations, redirect to participant page with status filter
      if (notification.type === 'manager_approved_registration') {
        router.visit(`/events/${notification.data.event_id}/participants?status=approved`);
      }
      else if (notification.type === 'manager_rejected_registration') {
        router.visit(`/events/${notification.data.event_id}/participants?status=rejected`);
      }
      // For pending/new registration notifications, go to pending section
      else if (
        notification.type === 'registration_pending' ||
        notification.type === 'new_registration'
      ) {
        router.visit(`/events/${notification.data.event_id}/participants?status=pending`);
      }
      // For member approval/rejection notifications, go to join-events with event dialog
      else if (
        notification.type === 'registration_approved' ||
        notification.type === 'registration_rejected'
      ) {
        router.visit(`/join-events?event_id=${notification.data.event_id}`);
      }
      // For other event notifications, go to join-events
      else {
        router.visit('/join-events');
      }
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await axios.put(`/notifications/${id}/read`);
      setLocalNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAsUnread = async (id: number) => {
    try {
      await axios.put(`/notifications/${id}/unread`);
      setLocalNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: null } : n))
      );
    } catch (error) {
      console.error('Failed to mark notification as unread:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('/notifications/mark-all-read');
      setLocalNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
      );
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await axios.delete(`/notifications/${id}`);
      setLocalNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const unreadCount = localNotifications.filter(n => !n.read_at).length;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Notifications" />

      <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50/50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <Bell className="h-6 w-6 text-purple-600" />
                    All Notifications
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {unreadCount > 0 && `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`}
                    {unreadCount === 0 && 'All caught up!'}
                  </p>
                </div>
                {unreadCount > 0 && (
                  <Button onClick={markAllAsRead} variant="outline" size="sm">
                    <Check className="h-4 w-4 mr-2" />
                    Mark all as read
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {localNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Bell className="h-16 w-16 mb-4 opacity-20" />
                  <p className="text-lg font-medium">No notifications yet</p>
                  <p className="text-sm">When you get notifications, they'll show up here</p>
                </div>
              ) : (
                <div className="divide-y">
                  {localNotifications.map((notification) => {
                    const { icon: NotifIcon, color } = getNotificationIcon(notification.type);
                    const badge = getNotificationBadge(notification.type);

                    return (
                      <div
                        key={notification.id}
                        className={`flex items-start gap-4 p-6 hover:bg-gray-50 transition-all cursor-pointer group relative ${
                          !notification.read_at ? 'bg-blue-50/30' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${color}`}>
                          <NotifIcon className="h-6 w-6" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className={`text-xs font-medium border ${badge.color}`}>
                              {badge.label}
                            </Badge>
                            {!notification.read_at && (
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            )}
                            {notification.data.handled && (
                              <Badge
                                variant="outline"
                                className={`text-xs font-medium border ${
                                  notification.data.handled_status === 'approved'
                                    ? 'bg-green-100 text-green-800 border-green-200'
                                    : 'bg-red-100 text-red-800 border-red-200'
                                }`}
                              >
                                {notification.data.handled_status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                              </Badge>
                            )}
                          </div>

                          <h3 className="font-semibold text-base mb-1">{notification.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>

                          {notification.data.event_name && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                              <Calendar className="h-3 w-3" />
                              <span>{notification.data.event_name}</span>
                            </div>
                          )}

                          {notification.data.handled && (
                            <p className="text-xs text-green-600 mt-2">
                              Handled by {notification.data.handled_by} • {formatTime(notification.data.handled_at || '')}
                            </p>
                          )}

                          <p className="text-xs text-muted-foreground mt-2">
                            {formatTime(notification.created_at)}
                          </p>
                        </div>

                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notification.read_at ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="h-9 w-9"
                              title="Mark as read"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsUnread(notification.id);
                              }}
                              className="h-9 w-9 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="Mark as unread"
                            >
                              <MailX className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {notifications.last_page > 1 && (
                <div className="flex items-center justify-center gap-2 p-6 border-t">
                  {notifications.links.map((link, index) => (
                    <Button
                      key={index}
                      variant={link.active ? 'default' : 'outline'}
                      size="sm"
                      disabled={!link.url}
                      onClick={() => link.url && router.visit(link.url)}
                      dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
