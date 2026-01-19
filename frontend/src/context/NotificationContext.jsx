import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { notificationAPI, getWebSocketURL } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback((title, message, icon = '/favicon.ico') => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: icon,
        badge: icon,
        tag: 'supermanage-notification',
        renotify: true,
      });
    }
  }, []);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const [notifs, countData] = await Promise.all([
        notificationAPI.getAll(user.id, false, 50),
        notificationAPI.getUnreadCount(user.id)
      ]);
      setNotifications(notifs || []);
      setUnreadCount(countData?.count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      await notificationAPI.markAllAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user?.id]);

  // Handle incoming WebSocket message
  const handleWebSocketMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.data);
      
      if (data.type === 'notification') {
        const notification = data.notification;
        
        // Add to notifications list
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show toast notification
        toast(notification.message, {
          icon: getNotificationIcon(notification.type),
          duration: 5000,
        });
        
        // Show browser notification
        showBrowserNotification(notification.title, notification.message);
      } else if (data.type === 'attendance_update') {
        // Handle real-time attendance updates
        const { action, data: attendanceData } = data;
        
        if (action === 'punch_in') {
          toast.success(`${attendanceData.emp_name} punched in at ${attendanceData.punch_in}`, {
            duration: 4000,
          });
        } else if (action === 'punch_out') {
          toast.success(`${attendanceData.emp_name} punched out`, {
            duration: 4000,
          });
        }
        
        // Dispatch custom event for components to listen to
        window.dispatchEvent(new CustomEvent('attendance-update', { detail: data }));
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }, [showBrowserNotification]);

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    if (!user?.id || wsRef.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = getWebSocketURL(user.id, user.role);
    
    try {
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
      };
      
      wsRef.current.onmessage = handleWebSocketMessage;
      
      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 5000);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
    }
  }, [user?.id, user?.role, handleWebSocketMessage]);

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Initialize on user login
  useEffect(() => {
    if (user?.id) {
      requestNotificationPermission();
      fetchNotifications();
      connectWebSocket();
    } else {
      disconnectWebSocket();
      setNotifications([]);
      setUnreadCount(0);
    }
    
    return () => {
      disconnectWebSocket();
    };
  }, [user?.id, requestNotificationPermission, fetchNotifications, connectWebSocket, disconnectWebSocket]);

  // Refresh notifications periodically (every 30 seconds as fallback)
  useEffect(() => {
    if (!user?.id) return;
    
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user?.id, fetchNotifications]);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    requestNotificationPermission,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Helper function to get notification icon based on type
function getNotificationIcon(type) {
  switch (type) {
    case 'attendance':
      return '🕐';
    case 'leave':
      return '📅';
    case 'bill':
      return '💰';
    case 'payslip':
      return '💵';
    default:
      return '🔔';
  }
}

export default NotificationContext;
