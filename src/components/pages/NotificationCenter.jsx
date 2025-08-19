import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { 
  setNotifications, 
  updateNotification, 
  removeNotification,
  setNotificationsLoading,
  setNotificationsError 
} from '@/store/melSlice';
import { notificationService } from '@/services/api/notificationService';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import Badge from '@/components/atoms/Badge';
import Loading from '@/components/ui/Loading';
import Empty from '@/components/ui/Empty';
import { cn } from '@/utils/cn';

const NotificationCenter = () => {
  const dispatch = useDispatch();
  const { notifications } = useSelector((state) => state.mel);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const priorityColors = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-blue-100 text-blue-800 border-blue-200',
    low: 'bg-green-100 text-green-800 border-green-200'
  };

  const typeIcons = {
    approval: 'CheckCircle',
    threshold: 'AlertTriangle'
  };

  const formatDate = (dateString) => {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM dd');
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const updated = await notificationService.markAsRead(notificationId);
      dispatch(updateNotification(updated));
      toast.success('Notification marked as read');
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      dispatch(setNotificationsLoading(true));
      await notificationService.markAllAsRead();
      const allNotifications = await notificationService.getAll();
      dispatch(setNotifications(allNotifications));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all notifications as read');
      dispatch(setNotificationsError(error.message));
    }
  };

  const handleDismiss = async (notificationId) => {
    try {
      await notificationService.dismiss(notificationId);
      dispatch(removeNotification(notificationId));
      toast.success('Notification dismissed');
    } catch (error) {
      toast.error('Failed to dismiss notification');
    }
  };

const getFilteredNotifications = () => {
    // Create defensive copy to avoid mutating Redux store state
    let filtered = [...(notifications.items || [])];

    // Apply filters
    switch (filter) {
      case 'unread':
        filtered = filtered.filter(n => !n.isRead);
        break;
      case 'approval':
        filtered = filtered.filter(n => n.type === 'approval');
        break;
      case 'threshold':
        filtered = filtered.filter(n => n.type === 'threshold');
        break;
      case 'actionRequired':
        filtered = filtered.filter(n => n.actionRequired);
        break;
      default:
        break;
    }

    // Apply sorting (safe to mutate our copy)
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'priority':
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        filtered.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
        break;
      default:
        break;
    }

    return filtered;
  };

  const filteredNotifications = getFilteredNotifications();

  if (notifications.loading) {
    return <Loading />;
  }

  return (
<div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Center</h1>
          <p className="text-gray-600">
            {notifications.unreadCount > 0 
              ? `${notifications.unreadCount} unread notification${notifications.unreadCount > 1 ? 's' : ''} including approval workflow updates`
              : 'All notifications are read - stay updated on submission approvals and feedback'
            }
          </p>
        </div>

        <div className="flex items-center gap-2">
          {notifications.unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="whitespace-nowrap"
            >
              <ApperIcon name="CheckCheck" size={16} className="mr-2" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <div className="flex flex-wrap gap-1">
              {[
                { key: 'all', label: 'All' },
                { key: 'unread', label: 'Unread' },
                { key: 'approval', label: 'Approvals' },
                { key: 'threshold', label: 'Alerts' },
                { key: 'actionRequired', label: 'Action Required' }
              ].map(({ key, label }) => (
                <Button
                  key={key}
                  variant={filter === key ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFilter(key)}
                  className="text-xs"
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority">By Priority</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Empty 
          message={filter === 'all' ? "No notifications found" : `No ${filter} notifications found`}
          description="Check back later for updates"
        />
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <motion.div
              key={notification.Id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className={cn(
                "p-4 transition-all duration-200 hover:shadow-md",
                !notification.isRead && "border-l-4 border-l-primary bg-primary/5"
              )}>
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                    notification.type === 'approval' 
                      ? "bg-blue-100 text-blue-600" 
                      : notification.priority === 'critical'
                        ? "bg-red-100 text-red-600"
                        : notification.priority === 'high'
                          ? "bg-orange-100 text-orange-600"
                          : "bg-yellow-100 text-yellow-600"
                  )}>
                    <ApperIcon 
                      name={typeIcons[notification.type] || 'Bell'} 
                      size={20} 
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <h3 className={cn(
                          "text-base font-medium text-gray-900 mb-1",
                          !notification.isRead && "font-semibold"
                        )}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs", priorityColors[notification.priority])}
                        >
                          {notification.priority.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Metadata */}
                    {notification.metadata && (
                      <div className="text-xs text-gray-500 mb-3 p-2 bg-gray-50 rounded">
                        {notification.type === 'approval' && notification.metadata.amount && (
                          <span>Amount: ${notification.metadata.amount.toLocaleString()}</span>
                        )}
                        {notification.type === 'threshold' && notification.metadata.currentValue && (
                          <span>
                            Current: {notification.metadata.currentValue}
                            {notification.metadata.unit} 
                            / Target: {notification.metadata.threshold}
                            {notification.metadata.unit}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.Id)}
                        >
                          <ApperIcon name="Check" size={14} className="mr-1" />
                          Mark Read
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismiss(notification.Id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <ApperIcon name="X" size={14} className="mr-1" />
                        Dismiss
                      </Button>

                      {notification.actionRequired && (
                        <Button
                          variant="default"
                          size="sm"
                          className="ml-auto"
                        >
                          <ApperIcon name="ExternalLink" size={14} className="mr-1" />
                          Take Action
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;