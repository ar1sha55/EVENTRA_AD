import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, MailX, AlertCircle, Calendar, CalendarDays, CheckCircle, Clock, Award, User, Megaphone, LifeBuoy, MessageSquareReply } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { router, usePage } from '@inertiajs/react';
import { edit as profileEdit } from '@/routes/profile';

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
  const { props } = usePage();
  const currentUser = (props as any).auth?.user;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    // Listen for notification-created event
    const handleNotificationCreated = () => {
      fetchUnreadCount();
    };

    window.addEventListener('notification-created', handleNotificationCreated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notification-created', handleNotificationCreated);
    };
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
    switch (type) {
      case 'event_upcoming': return { icon: Calendar, color: 'text-yellow-600' };
      case 'event_new': return { icon: CalendarDays, color: 'text-blue-600' };
      case 'registration_approved': return { icon: CheckCircle, color: 'text-green-600' };
      case 'registration_rejected': return { icon: Bell, color: 'text-red-600' };
      case 'ranking_update': return { icon: Award, color: 'text-purple-600' };
      case 'registration_pending': return { icon: Clock, color: 'text-orange-600' };
      case 'new_registration': return { icon: User, color: 'text-indigo-600' };
      case 'manager_approved_registration': return { icon: CheckCircle, color: 'text-green-600' };
      case 'manager_rejected_registration': return { icon: Bell, color: 'text-red-600' };
      case 'profile_incomplete': return { icon: AlertCircle, color: 'text-amber-600' };
      case 'announcement': return { icon: Megaphone, color: 'text-orange-600' };
      case 'support_ticket': return { icon: LifeBuoy, color: 'text-orange-600' };
      case 'support_response': return { icon: MessageSquareReply, color: 'text-blue-600' };
      default: return { icon: Bell, color: 'text-gray-600' };
    }
  };

  const getNotificationBadge = (type: string) => {
    const badges = {
      event_upcoming: { label: 'Upcoming', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400' },
      event_new: { label: 'New Event', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400' },
      registration_approved: { label: 'Approved', color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400' },
      registration_rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400' },
      ranking_update: { label: 'Ranking', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400' },
      registration_pending: { label: 'Pending', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400' },
      new_registration: { label: 'New Member', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-400' },
      manager_approved_registration: { label: 'Action Confirmed', color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400' },
      manager_rejected_registration: { label: 'Action Confirmed', color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400' },
      profile_incomplete: { label: 'Profile', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400' },
      announcement: { label: 'Announcement', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400' },
      support_ticket: { label: 'Support', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400' },
      support_response: { label: 'Response', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400' },
    };
    return badges[type as keyof typeof badges] || { label: 'Info', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-400' };
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read_at) {
      markAsRead(notification.id);
    }

    // Handle profile incomplete notification
    if (notification.type === 'profile_incomplete') {
      setIsOpen(false);
      router.visit(profileEdit().url);
      return;
    }

    // Handle announcement notification - just mark as read, no navigation
    if (notification.type === 'announcement') {
      // Already marked as read above, just close dropdown
      setIsOpen(false);
      return;
    }

    // Handle support ticket notifications
    if (notification.type === 'support_ticket' && notification.data.ticket_id) {
      setIsOpen(false);
      router.visit(`/admin/support-tickets/${notification.data.ticket_id}`);
      return;
    }

    if (notification.type === 'support_response' && notification.data.ticket_id) {
      setIsOpen(false);
      router.visit('/support-history');
      return;
    }

    // Navigate to relevant page based on notification type
    if (notification.data.event_id) {
      setIsOpen(false);

      // For manager-specific action confirmations, go to participant page with status filter
      if (notification.type === 'manager_approved_registration') {
        router.visit(`/events/${notification.data.event_id}/participants?status=approved`);
      }
      else if (notification.type === 'manager_rejected_registration') {
        router.visit(`/events/${notification.data.event_id}/participants?status=rejected`);
      }
      // For pending registration notifications, go to pending section
      else if (notification.type === 'registration_pending') {
        router.visit(`/events/${notification.data.event_id}/participants?status=pending`);
      }
      // For new registration notifications, go to all participants
      else if (notification.type === 'new_registration') {
        router.visit(`/events/${notification.data.event_id}/participants`);
      }
      // For member approval/rejection notifications, go to join-events with event dialog
      else if (
        notification.type === 'registration_approved' ||
        notification.type === 'registration_rejected'
      ) {
        router.visit(`/join-events?event_id=${notification.data.event_id}`);
      }
      // For new event and upcoming event notifications
      else if (notification.type === 'event_new' || notification.type === 'event_upcoming') {
        // Managers go to manage events page with modal
        if (currentUser?.role === 'manager' || currentUser?.role === 'admin') {
          router.visit(`/events?view_event_id=${notification.data.event_id}`);
        } else {
          // Members go to join-events with event dialog
          router.visit(`/join-events?event_id=${notification.data.event_id}`);
        }
      }
      // For other event notifications, go to join-events page
      else {
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

  const getEventCountdown = (startDate: string) => {
    const now = new Date();
    const eventDate = new Date(startDate);
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return null; // Event has passed
    if (diffDays === 0) return { text: 'Today!', color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400' };
    if (diffDays === 1) return { text: '1 day left', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400' };
    if (diffDays === 2) return { text: '2 days left', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400' };
    if (diffDays === 3) return { text: '3 days left', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400' };
    if (diffDays <= 7) return { text: `${diffDays} days left`, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400' };
    if (diffDays <= 14) return { text: `${diffDays} days left`, color: 'bg-slate-100 text-slate-800 dark:bg-slate-800/40 dark:text-slate-400' };
    return null; // Don't show countdown if more than 2 weeks away
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
        <div className="px-4 py-3 border-b flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 dark:border-gray-700">
          <h3 className="font-semibold text-lg">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs hover:bg-purple-100 dark:hover:bg-purple-900/50"
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
                const { icon: NotifIcon, color } = getNotificationIcon(notification.type);
                return (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer relative group ${
                      !notification.read_at ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 ${color}`}>
                        <NotifIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`text-xs ${badge.color}`}>
                            {badge.label}
                          </Badge>
                          {!notification.read_at && (
                            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                          )}
                          {notification.type === 'event_upcoming' && notification.data.start_date && (() => {
                            const countdown = getEventCountdown(notification.data.start_date);
                            return countdown ? (
                              <Badge className={`text-xs font-semibold ${countdown.color}`}>
                                {countdown.text}
                              </Badge>
                            ) : null;
                          })()}
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
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50"
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
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
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
          <div className="px-4 py-3 border-t bg-gray-50 dark:bg-gray-900/30 dark:border-gray-700">
            <Button
              variant="link"
              className="w-full text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
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
