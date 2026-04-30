import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Check, Trash2, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { notificationService } from '../../services/notification.service';
import { Notification } from '../../types/notification.types';
import Loader from './Loader';
import { formatDistanceToNow } from '../../utils/formatters';

const NotificationDropdown: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await notificationService.getMyNotifications();
      if (response.success) {
        const notifs = response.data as Notification[];
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n) => !n.readStatus).length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleToggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Refresh when opening
      fetchNotifications();
    }
  };

  const handleMarkAsRead = async (id: string) => {
    setMarkingId(id);
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, readStatus: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read', error);
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, readStatus: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setUnreadCount((prev) => Math.max(0, prev - (notifications.find((n) => n._id === id)?.readStatus ? 0 : 1)));
    } catch (error) {
      console.error('Failed to delete notification', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task.created':
      case 'task.assigned':
      case 'project.created':
      case 'comment.created':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'task.updated':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'task.created':
      case 'task.assigned':
      case 'project.created':
        return 'bg-green-50 border-green-100';
      case 'task.updated':
        return 'bg-yellow-50 border-yellow-100';
      case 'comment.created':
        return 'bg-blue-50 border-blue-100';
      default:
        return 'bg-gray-50 border-gray-100';
    }
  };

  return (
    <>
      {/* Notification Bell */}
      <div className="relative">
        <button
          onClick={handleToggleOpen}
          className="p-2.5 relative rounded-xl hover:bg-blue-50 text-gray-500 hover:text-primary transition-colors border border-transparent hover:border-blue-100"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 mt-2 w-96 max-h-[80vh] bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h3 className="font-bold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs font-semibold text-primary hover:underline flex items-center"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="overflow-y-auto flex-1 max-h-96">
                {loading ? (
                  <div className="p-8 flex justify-center">
                    <Loader size="small" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 font-medium">
                    <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                        !notification.readStatus ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getTypeIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-400">
                              {formatDistanceToNow(notification.createdAt)}
                            </span>
                            <div className="flex items-center gap-1">
                              {!notification.readStatus && (
                                <button
                                  onClick={() => handleMarkAsRead(notification._id)}
                                  disabled={markingId === notification._id}
                                  className="p-1.5 hover:bg-blue-100 rounded-lg text-gray-400 hover:text-primary transition-colors"
                                  title="Mark as read"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(notification._id)}
                                className="p-1.5 hover:bg-red-100 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-gray-100 text-center">
                  <button className="text-xs font-semibold text-gray-500 hover:text-primary transition-colors">
                    View all notifications
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default NotificationDropdown;
