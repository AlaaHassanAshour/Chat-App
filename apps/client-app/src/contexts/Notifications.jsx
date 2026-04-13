import { createContext, useContext, useMemo, useState, useEffect } from "react";

import { notification as antNotification } from "../utils/InitAntStaticApi";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/api";

const NotificationsContext = createContext(null);

const normalizeNotification = (item) => ({
  id: item.id || item.notificationId || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  title: item.title || item.subject || "Notification",
  description: item.description || item.message || "",
  type: item.type || "info",
  meta: item.meta || null,
  isRead: Boolean(item.isRead || item.readAt),
  createdAt: item.createdAt || item.createdOn || new Date().toISOString(),
});

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await getNotifications();
        const rows = Array.isArray(response)
          ? response
          : Array.isArray(response?.items)
            ? response.items
            : Array.isArray(response?.data)
              ? response.data
              : [];
        setNotifications(rows.map(normalizeNotification));
      } catch {
        setNotifications([]);
      }
    };

    loadNotifications();
  }, []);

  const pushNotification = ({
    title,
    description,
    type = "info",
    meta = null,
  }) => {
    const item = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      title,
      description,
      type,
      meta,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    setNotifications((prev) => [item, ...prev]);

    if (antNotification?.[type]) {
      antNotification[type]({
        message: title,
        description,
        placement: "topRight",
      });
    }
  };

  const markAsRead = async (id) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isRead: true } : item
      )
    );

    if (!id?.toString().startsWith("local-")) {
      try {
        await markNotificationAsRead(id);
      } catch {
        // Keep optimistic UI update.
      }
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    try {
      await markAllNotificationsAsRead();
    } catch {
      // Keep optimistic UI update.
    }
  };

  const markConversationAsRead = async ({ senderId, groupId }) => {
    const targetIds = notifications
      .filter((item) => {
        if (item.isRead) return false;
        if (senderId) {
          return item.meta?.senderId?.toString() === senderId.toString();
        }
        if (groupId) {
          return item.meta?.groupId?.toString() === groupId.toString();
        }
        return false;
      })
      .map((item) => item.id);

    if (targetIds.length === 0) return;

    setNotifications((prev) =>
      prev.map((item) =>
        targetIds.includes(item.id) ? { ...item, isRead: true } : item
      )
    );

    await Promise.all(
      targetIds
        .filter((id) => !id?.toString().startsWith("local-"))
        .map(async (id) => {
          try {
            await markNotificationAsRead(id);
          } catch {
            // Keep optimistic UI update.
          }
        })
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications]
  );

  const value = {
    notifications,
    unreadCount,
    pushNotification,
    markAsRead,
    markAllAsRead,
    markConversationAsRead,
    clearNotifications,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used inside NotificationsProvider");
  }
  return context;
};
