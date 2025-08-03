'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
  onClose?: () => void;
}

export function Notification({ message, type, duration = 4000, onClose }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-400" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'info':
        return 'bg-blue-500';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 300, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 300, scale: 0.8 }}
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg backdrop-blur-sm border border-white/20 ${getBgColor()} text-white max-w-sm`}
        >
          <div className="flex items-start space-x-3">
            {getIcon()}
            <div className="flex-1">
              <p className="text-sm font-medium">{message}</p>
            </div>
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => onClose?.(), 300);
              }}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {/* Progress bar */}
          <motion.div
            className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-b-lg"
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: duration / 1000, ease: 'linear' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Notification manager
class NotificationManager {
  private notifications: Array<{ id: string; props: NotificationProps }> = [];
  private listeners: Array<() => void> = [];

  addNotification(props: NotificationProps) {
    const id = Math.random().toString(36).substr(2, 9);
    this.notifications.push({ id, props });
    this.notifyListeners();
  }

  removeNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  getNotifications() {
    return this.notifications;
  }
}

export const notificationManager = new NotificationManager();

// Hook to use notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState(notificationManager.getNotifications());

  useEffect(() => {
    const unsubscribe = notificationManager.subscribe(() => {
      setNotifications(notificationManager.getNotifications());
    });

    return unsubscribe;
  }, []);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info', duration?: number) => {
    notificationManager.addNotification({ message, type, duration });
  };

  const removeNotification = (id: string) => {
    notificationManager.removeNotification(id);
  };

  return { notifications, showNotification, removeNotification };
} 