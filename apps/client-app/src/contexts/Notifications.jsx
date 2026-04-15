import { createContext, useContext, useMemo, useState, useEffect, useCallback, useRef } from "react";

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

const getNotificationKey = (item) => {
  if (item.id && !item.id.toString().startsWith("local-")) {
    return `id:${item.id}`;
  }

  const type = item.meta?.conversationType || "generic";
  const senderId = item.meta?.senderId || "";
  const groupId = item.meta?.groupId || "";
  const time = item.meta?.timestamp || item.createdAt || "";
  return `sig:${type}:${senderId}:${groupId}:${item.description}:${time}`;
};

const dedupeNotifications = (rows) => {
  const seen = new Set();
  return rows.filter((item) => {
    const key = getNotificationKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const isReloadingRef = useRef(false);

  const reloadNotifications = useCallback(async ({ silent = false } = {}) => {
    if (isReloadingRef.current) return;
    isReloadingRef.current = true;

    try {
      if (!silent) {
        setIsLoadingNotifications(true);
      }

      const response = await getNotifications();
      const rows = Array.isArray(response)
        ? response
        : Array.isArray(response?.items)
          ? response.items
          : Array.isArray(response?.data)
            ? response.data
            : [];
      setNotifications(dedupeNotifications(rows.map(normalizeNotification)));
    } catch {
      setNotifications([]);
    } finally {
      isReloadingRef.current = false;
      if (!silent) {
        setIsLoadingNotifications(false);
      }
    }
  }, []);

  useEffect(() => {
    reloadNotifications();
  }, [reloadNotifications]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      reloadNotifications({ silent: true });
    }, 30000);

    return () => clearInterval(intervalId);
  }, [reloadNotifications]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        reloadNotifications({ silent: true });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [reloadNotifications]);

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

    setNotifications((prev) => {
      const next = dedupeNotifications([item, ...prev]);
      return next;
    });

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
          const notificationType = item.meta?.conversationType;
          const isGroup = notificationType === "group" || Boolean(item.meta?.groupId);
          if (isGroup) return false;
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
    isLoadingNotifications,
    reloadNotifications,
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
