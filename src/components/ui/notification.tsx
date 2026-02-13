"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

export type NotificationType = "success" | "error" | "info" | "warning";

interface NotificationProps {
  message: string;
  type: NotificationType;
  onClose: () => void;
  duration?: number;
}

export function Notification({ 
  message, 
  type, 
  onClose, 
  duration = 5000 
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClick = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const getStyles = () => {
    switch (type) {
      case "success":
        return {
          bg: "bg-[#001F05] border-green-500/50",
          icon: CheckCircle,
          iconColor: "text-green-400",
        };
      case "error":
        return {
          bg: "bg-red-900/20 border-red-500/50",
          icon: AlertCircle,
          iconColor: "text-red-400",
        };
      case "warning":
        return {
          bg: "bg-yellow-900/20 border-yellow-500/50",
          icon: AlertTriangle,
          iconColor: "text-yellow-400",
        };
      case "info":
        return {
          bg: "bg-blue-900/20 border-blue-500/50",
          icon: Info,
          iconColor: "text-blue-400",
        };
    }
  };

  const styles = getStyles();
  const Icon = styles.icon;

  return (
    <div
      className={`max-w-md w-full transform transition-all duration-300 ease-in-out ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
      onClick={handleClick}
    >
      <div className={`${styles.bg} border backdrop-blur-sm text-white p-4 rounded-lg shadow-2xl flex items-start gap-3 cursor-pointer hover:opacity-90 transition-opacity`}>
        <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${styles.iconColor}`} />
        <p className="text-sm font-medium flex-1 leading-relaxed">{message}</p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Hook para gerenciar notificações
export function useNotification() {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    message: string;
    type: NotificationType;
  }>>([]);

  const showNotification = (message: string, type: NotificationType = "info") => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const NotificationContainer = () => (
    <div className="fixed top-4 right-4 z-[9998] flex flex-col gap-2 max-w-md">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={() => removeNotification(notification.id)}
          duration={notification.type === "error" ? 7000 : 5000}
        />
      ))}
    </div>
  );

  return {
    showNotification,
    NotificationContainer
  };
}













