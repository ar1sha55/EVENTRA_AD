import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, X, Trash2, MailX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { router } from '@inertiajs/react';

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
  };
  read_at: string | null;
  created_at: string;
}

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/notifications/recent');
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get('/notifications/unread-count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await axios.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAsUnread = async (id: number) => {
    try {
      await axios.put(`/notifications/${id}/unread`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: null } : n))
      );
      setUnreadCount((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to mark notification as unread:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('/notifications/mark-all-read');
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await axios.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      fetchUnreadCount();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    const colors = {
      event_upcoming: 'text-yellow-600',
      event_new: 'text-blue-600',
      registration_approved: 'text-green-600',
      registration_rejected: 'text-red-600',
      ranking_update: 'text-purple-600',
      registration_pending: 'text-orange-600',
      new_registration: 'text-indigo-600',
    };
    return colors[type as keyof typeof colors] || 'text-gray-600';
  };

  const getNotificationBadge = (type: string) => {
    const badges = {
      event_upcoming: { label: 'Upcoming', color: 'bg-yellow-100 text-yellow-800' },
      event_new: { label: 'New Event', color: 'bg-blue-100 text-blue-800' },
      registration_approved: { label: 'Approved', color: 'bg-green-100 text-green-800' },
      registration_rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
      ranking_update: { label: 'Ranking', color: 'bg-purple-100 text-purple-800' },
      registration_pending: { label: 'Pending', color: 'bg-orange-100 text-orange-800' },
      new_registration: { label: 'New Member', color: 'bg-indigo-100 text-indigo-800' },
    };
    return badges[type as keyof typeof badges] || { label: 'Info', color: 'bg-gray-100 text-gray-800' };
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read_at) {
      markAsRead(notification.id);
    }

    // Navigate to relevant page based on notification type
    if (notification.data.event_id) {
      setIsOpen(false);

      // For manager notifications (pending/new registrations), go to participant page
      if (notification.type === 'registration_pending' || notification.type === 'new_registration') {
        router.visit(`/events/${notification.data.event_id}/participants`);
      } else {
        // For member notifications, go to join-events page
        router.visit('/join-events');
      }
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-h-[500px] overflow-hidden flex flex-col p-0">
        <div className="px-4 py-3 border-b flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50">
          <h3 className="font-semibold text-lg">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs hover:bg-purple-100"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="overflow-y-auto flex-1">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mb-2 opacity-20" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const badge = getNotificationBadge(notification.type);
                return (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer relative group ${
                      !notification.read_at ? 'bg-blue-50/30' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 ${getNotificationIcon(notification.type)}`}>
                        <Bell className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`text-xs ${badge.color}`}>
                            {badge.label}
                          </Badge>
                          {!notification.read_at && (
                            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                          )}
                        </div>
                        <p className="font-medium text-sm mb-1">{notification.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.read_at ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsUnread(notification.id);
                            }}
                            title="Mark as unread"
                          >
                            <MailX className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="px-4 py-3 border-t bg-gray-50">
            <Button
              variant="link"
              className="w-full text-sm text-purple-600 hover:text-purple-700"
              onClick={() => {
                setIsOpen(false);
                router.visit('/notifications');
              }}
            >
              View all notifications
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
