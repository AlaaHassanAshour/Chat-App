// src/components/ChatRoom.jsx
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { HubConnectionBuilder } from "@microsoft/signalr";
import { jwtDecode } from "jwt-decode";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";

import {
  getAllUsers,
  getOnlineUsers,
  getPrivateMessages,
  markPrivateMessagesAsRead,
  markGroupMessagesAsRead,
  getGroupsUser,
  getMassegesGroups,
  createGroub,
  sendMessages,
  searchMessages,
} from "../services/api";

import {
  Layout,
  Modal,
  Menu,
  Checkbox,
  Button,
  List,
  Input,
  Typography,
  Divider,
  theme,
  Spin,
  Empty,
  Avatar,
  Badge,
  Tag,
  Tooltip,
} from "antd";
import {
  UserOutlined,
  TeamOutlined,
  PlusOutlined,
  SendOutlined,
  WechatOutlined,
  SearchOutlined,
  CloseOutlined,
  CheckOutlined,
} from "@ant-design/icons";

import { AUTH_CONFIG } from "../config/env";
import { useNotifications } from "../contexts/Notifications";
import "./ChatRoom.css";

const { Sider, Content } = Layout;
const { TextArea } = Input;

/* ------------------------------------------------------------------ */
/* 🔧 helper */
const mapMessages = (rows, currentUserId) =>
  rows.map((m) => ({
    id: m.id,
    senderId: m.senderId,
    receiverId: m.receiverId,
    chatGroupId: m.chatGroupId,
    senderName: m.senderName,
    content: m.content,
    mine: m.senderId === currentUserId,
    timestamp: m.timestamp,
    isRead: Boolean(m.isRead || m.readAt),
    readAt: m.readAt || null,
  }));

const extractMessageRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.messages)) return payload.messages;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data?.messages)) return payload.data.messages;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const normalizeGroupName = (groupName) => (groupName || "").trim().toLowerCase();

const getReadEventReadAt = (args) => {
  const payload = args.find((arg) => arg && typeof arg === "object" && !Array.isArray(arg));
  if (payload?.readAt) return payload.readAt;

  const dateLikeArg = args.find(
    (arg) => typeof arg === "string" && !Number.isNaN(Date.parse(arg))
  );
  return dateLikeArg || new Date().toISOString();
};

const normalizeUserId = (value) => value?.toString()?.trim()?.toLowerCase();

const getMetaField = (meta, ...names) => {
  if (!meta || typeof meta !== "object") return undefined;

  const keys = Object.keys(meta);
  for (const name of names) {
    const foundKey = keys.find((k) => k.toLowerCase() === name.toLowerCase());
    if (foundKey) return meta[foundKey];
  }

  return undefined;
};

const isGroupNotification = (notification) => {
  const type = (
    notification?.meta?.conversationType ||
    notification?.type ||
    notification?.Type ||
    ""
  )
    .toString()
    .toLowerCase();

  const groupId =
    getMetaField(notification?.meta, "groupId", "chatGroupId") ||
    getMetaField(notification?.Meta, "groupId", "chatGroupId");

  return type.includes("group") || type === "group" || Boolean(groupId);
};

const isDirectNotification = (notification) => {
  const type = (notification?.meta?.conversationType || "").toString().toLowerCase();
  const hasSender = Boolean(
    getMetaField(notification?.meta, "senderId") ||
      getMetaField(notification?.Meta, "senderId") ||
      notification?.senderId
  );
  return !isGroupNotification(notification) && (type === "direct" || hasSender);
};

  /**
 * Decode JWT once whenever token changes.
 */
const useCurrentUserId = (token) =>
  useMemo(() => {
    if (!token) return null;
    const decoded = jwtDecode(token);
    return decoded.userId || decoded.nameid || decoded.sub;
  }, [token]);

/**
 * Map raw message DTO coming from API → UI model.
 */



export default function ChatRoom() {
  const navigate = useNavigate();
  const { userId: routeUserId, groupId: routeGroupId } = useParams();
  const { t, i18n } = useTranslation();
  const { pushNotification, notifications, markConversationAsRead } = useNotifications();
  /* ------------------------------------------------------------------ */
  /* 🆔 user & token */
    const token = localStorage.getItem(AUTH_CONFIG.tokenKey || "accessToken");
    const currentUserId = useCurrentUserId(token);

  // const token = localStorage.getItem(AUTH_CONFIG.tokenKey || "accessToken");
  // const decoded = token ? jwtDecode(token) : {};
  // const currentUserId = decoded.userId || decoded.nameid || decoded.sub;

  /* ------------------------------------------------------------------ */
  /* 🏷️ state */
  const [hub, setHub] = useState(null);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);

  const [selectedReceiverId, setSelectedReceiverId] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [messagesLoading, setMessagesLoading] = useState(false);

  /* search */
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [typingUsersInGroup, setTypingUsersInGroup] = useState({});

  /* new‑group modal */
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);

  /* scroll‑bottom ref */
  const bottomRef = useRef(null);
  const firstUnreadRef = useRef(null);
  const { token: themeToken } = theme.useToken();
  const typingTimeoutsRef = useRef({});
  const groupTypingTimeoutsRef = useRef({});
  const recentNotificationRef = useRef(new Map());
  const typingEmitTimeoutRef = useRef(null);

  /* ------------------------------------------------------------------ */
  /* 🔌 SignalR connection (once) */
  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl("https://localhost:7056/chatHub", {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    connection
      .start()
      .then(() => setHub(connection))
      .catch((err) => console.error("SignalR error:", err));

    return () => connection.stop();
  }, [token]);

  const selectedUser = useMemo(
    () => users.find((u) => u.id?.toString() === selectedReceiverId?.toString()),
    [users, selectedReceiverId]
  );

  const selectedGroup = useMemo(
    () => groups.find((g) => g.id?.toString() === selectedGroupId?.toString()),
    [groups, selectedGroupId]
  );

  /* ------------------------------------------------------------------ */
  /* 📥 listeners */
  useEffect(() => {
    if (!hub) return;

    const currentUserKey = normalizeUserId(currentUserId);
    const selectedDirectKey = selectedReceiverId?.toString();
    const selectedGroupKey = selectedGroupId?.toString();
    const shouldEmitNotification = (key) => {
      const now = Date.now();
      const ttlMs = 1800;
      const map = recentNotificationRef.current;

      for (const [existingKey, ts] of map.entries()) {
        if (now - ts > ttlMs) {
          map.delete(existingKey);
        }
      }

      if (!key) return true;
      if (map.has(key)) return false;

      map.set(key, now);
      return true;
    };

    const onReceivePrivate = (senderId, senderName, content, timestamp) => {
      const isMine = normalizeUserId(senderId) === currentUserKey;
      const senderKey = senderId?.toString();
      const isActiveDirectConversation =
        !isMine && selectedDirectKey && senderKey === selectedDirectKey;
      const notificationKey = `direct:${senderKey}:${timestamp}:${content}`;

      setMessages((prev) => [
        ...prev,
        {
          id: `${senderId}-${timestamp}`,
          senderId,
          receiverId: isMine ? selectedReceiverId : currentUserId,
          senderName,
          content,
          mine: isMine,
          timestamp,
          isRead: false,
          readAt: null,
        },
      ]);

      if (!isMine && !isActiveDirectConversation && shouldEmitNotification(notificationKey)) {
        pushNotification({
          title: t("notifications.new_message"),
          description: `${senderName}: ${content}`,
          type: "info",
          meta: {
            conversationType: "direct",
            senderId,
            senderName,
            timestamp,
          },
        });
      }
    };

    const onReceiveGroup = (
      senderId,
      senderName,
      content,
      timestamp,
      groupId,
      groupName
    ) => {
      const isMine = normalizeUserId(senderId) === currentUserKey;
      const groupKey = groupId?.toString();
      const isActiveGroupConversation =
        !isMine && selectedGroupKey && groupKey && groupKey === selectedGroupKey;
      const notificationKey = `group:${groupKey}:${senderId}:${timestamp}:${content}`;

      setMessages((prev) => [
        ...prev,
        {
          id: `${groupId}-${senderId}-${timestamp}`,
          senderId,
          chatGroupId: groupId,
          senderName,
          content,
          mine: isMine,
          timestamp,
          isRead: false,
          readAt: null,
        },
      ]);

      if (!isMine && !isActiveGroupConversation && shouldEmitNotification(notificationKey)) {
        pushNotification({
          title: t("notifications.new_group_message"),
          description: `${senderName}: ${content}`,
          type: "info",
          meta: {
            conversationType: "group",
            groupId: groupId?.toString(),
            groupName,
            senderId,
            senderName,
            timestamp,
          },
        });
      }
    };

    const onReceiveNotification = (notification) => {
      if (!notification) return;

      const meta = notification.meta || notification.Meta || {};
      const senderId = getMetaField(meta, "senderId");
      const groupId = getMetaField(meta, "groupId", "chatGroupId");
      const isMine = normalizeUserId(senderId) === currentUserKey;
      const rawType = (notification.type || notification.Type || "info").toString().toLowerCase();
      const conversationType =
        rawType.includes("group") || groupId ? "group" : "direct";
      const senderKey = senderId?.toString();
      const groupKey = groupId?.toString();
      const isActiveDirectConversation =
        conversationType === "direct" && selectedDirectKey && senderKey === selectedDirectKey;
      const isActiveGroupConversation =
        conversationType === "group" && selectedGroupKey && groupKey === selectedGroupKey;
      const notificationKey = `${conversationType}:${groupKey || senderKey}:${notification.createdAt || notification.CreatedAt || ""}:${notification.description || notification.Description || ""}`;

      if (isMine) return;
      if (isActiveDirectConversation || isActiveGroupConversation) return;
      if (!shouldEmitNotification(notificationKey)) return;

      pushNotification({
        title: notification.title || notification.Title || t("notifications.title"),
        description: notification.description || notification.Description || "",
        type: notification.type || notification.Type || "info",
        meta: {
          conversationType,
          groupId: groupId?.toString(),
          senderId: senderId?.toString(),
          timestamp: notification.createdAt || notification.CreatedAt || new Date().toISOString(),
        },
      });
    };

    const clearDirectTypingTimeout = (userId) => {
      const key = userId?.toString();
      if (!key) return;
      const timeoutId = typingTimeoutsRef.current[key];
      if (timeoutId) {
        clearTimeout(timeoutId);
        delete typingTimeoutsRef.current[key];
      }
    };

    const clearGroupTypingTimeout = (groupName, userId) => {
      const groupKey = normalizeGroupName(groupName);
      const userKey = userId?.toString();
      if (!groupKey || !userKey) return;

      const timeoutKey = `${groupKey}:${userKey}`;
      const timeoutId = groupTypingTimeoutsRef.current[timeoutKey];
      if (timeoutId) {
        clearTimeout(timeoutId);
        delete groupTypingTimeoutsRef.current[timeoutKey];
      }
    };

    const onUserOnline = (userId) => {
      const key = userId?.toString();
      if (!key) return;
      setOnlineUsers((prev) => ({ ...prev, [key]: true }));
    };

    const onUserOffline = (userId) => {
      const key = userId?.toString();
      if (!key) return;

      setOnlineUsers((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });

      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    };

    const onUserTyping = (userId) => {
      const key = userId?.toString();
      if (!key || key === currentUserId?.toString()) return;

      setTypingUsers((prev) => ({ ...prev, [key]: true }));
      clearDirectTypingTimeout(key);
      typingTimeoutsRef.current[key] = setTimeout(() => {
        setTypingUsers((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }, 4000);
    };

    const onUserStoppedTyping = (userId) => {
      const key = userId?.toString();
      if (!key) return;

      clearDirectTypingTimeout(key);
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    };

    const onUserTypingInGroup = (userId, groupName) => {
      const groupKey = normalizeGroupName(groupName);
      const userKey = userId?.toString();
      if (!groupKey || !userKey || userKey === currentUserId?.toString()) return;

      setTypingUsersInGroup((prev) => {
        const existing = prev[groupKey] || {};
        return {
          ...prev,
          [groupKey]: {
            ...existing,
            [userKey]: true,
          },
        };
      });

      clearGroupTypingTimeout(groupKey, userKey);
      groupTypingTimeoutsRef.current[`${groupKey}:${userKey}`] = setTimeout(() => {
        setTypingUsersInGroup((prev) => {
          const groupEntry = prev[groupKey] || {};
          const nextGroupEntry = { ...groupEntry };
          delete nextGroupEntry[userKey];

          const next = { ...prev };
          if (Object.keys(nextGroupEntry).length === 0) {
            delete next[groupKey];
          } else {
            next[groupKey] = nextGroupEntry;
          }

          return next;
        });
      }, 4000);
    };

    const onUserStoppedTypingInGroup = (userId, groupName) => {
      const groupKey = normalizeGroupName(groupName);
      const userKey = userId?.toString();
      if (!groupKey || !userKey) return;

      clearGroupTypingTimeout(groupKey, userKey);
      setTypingUsersInGroup((prev) => {
        const groupEntry = prev[groupKey] || {};
        const nextGroupEntry = { ...groupEntry };
        delete nextGroupEntry[userKey];

        const next = { ...prev };
        if (Object.keys(nextGroupEntry).length === 0) {
          delete next[groupKey];
        } else {
          next[groupKey] = nextGroupEntry;
        }

        return next;
      });
    };

    const onMessagesRead = (...args) => {
      const payload = args.find((arg) => arg && typeof arg === "object" && !Array.isArray(arg));
      const readAt = getReadEventReadAt(args);
      const relatedIds = [
        payload?.readerId,
        payload?.userId,
        payload?.senderId,
        payload?.receiverId,
        ...args.filter((arg) => typeof arg === "string" && Number.isNaN(Date.parse(arg))),
      ]
        .filter(Boolean)
        .map((value) => value.toString());

      if (!selectedReceiverId || !relatedIds.includes(selectedReceiverId.toString())) return;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.mine && !msg.chatGroupId
            ? { ...msg, isRead: true, readAt: msg.readAt || readAt }
            : msg
        )
      );
    };

    const onGroupMessagesRead = (...args) => {
      const payload = args.find((arg) => arg && typeof arg === "object" && !Array.isArray(arg));
      const readAt = getReadEventReadAt(args);
      const relatedGroupIds = [
        payload?.groupId,
        payload?.chatGroupId,
        ...args.filter((arg) => typeof arg === "number" || (typeof arg === "string" && /^\d+$/.test(arg))),
      ]
        .filter(Boolean)
        .map((value) => value.toString());
      const relatedGroupNames = [payload?.groupName, ...args.filter((arg) => typeof arg === "string")]
        .filter(Boolean)
        .map((value) => normalizeGroupName(value));

      const matchesSelectedGroup =
        (selectedGroupId && relatedGroupIds.includes(selectedGroupId.toString())) ||
        (selectedGroup?.name && relatedGroupNames.includes(normalizeGroupName(selectedGroup.name)));

      if (!matchesSelectedGroup) return;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.mine && msg.chatGroupId?.toString() === selectedGroupId?.toString()
            ? { ...msg, isRead: true, readAt: msg.readAt || readAt }
            : msg
        )
      );
    };

    hub.on("ReceivePrivateMessage", onReceivePrivate);
    hub.on("ReceiveGroupMessage", onReceiveGroup);
    hub.on("ReceiveNotification", onReceiveNotification);
    hub.on("ReceiveMessage", onReceivePrivate);
    hub.on("MessagesRead", onMessagesRead);
    hub.on("GroupMessagesRead", onGroupMessagesRead);
    hub.on("UserOnline", onUserOnline);
    hub.on("UserOffline", onUserOffline);
    hub.on("UserTyping", onUserTyping);
    hub.on("UserStoppedTyping", onUserStoppedTyping);
    hub.on("UserTypingInGroup", onUserTypingInGroup);
    hub.on("UserStoppedTypingInGroup", onUserStoppedTypingInGroup);

    return () => {
      hub.off("ReceivePrivateMessage", onReceivePrivate);
      hub.off("ReceiveGroupMessage", onReceiveGroup);
      hub.off("ReceiveNotification", onReceiveNotification);
      hub.off("ReceiveMessage", onReceivePrivate);
      hub.off("MessagesRead", onMessagesRead);
      hub.off("GroupMessagesRead", onGroupMessagesRead);
      hub.off("UserOnline", onUserOnline);
      hub.off("UserOffline", onUserOffline);
      hub.off("UserTyping", onUserTyping);
      hub.off("UserStoppedTyping", onUserStoppedTyping);
      hub.off("UserTypingInGroup", onUserTypingInGroup);
      hub.off("UserStoppedTypingInGroup", onUserStoppedTypingInGroup);
    };
  }, [hub, currentUserId, pushNotification, t, selectedReceiverId, selectedGroupId, selectedGroup]);

  useEffect(() => {
    const typingTimeouts = typingTimeoutsRef.current;
    const groupTypingTimeouts = groupTypingTimeoutsRef.current;

    return () => {
      Object.values(typingTimeouts).forEach((timeoutId) => clearTimeout(timeoutId));
      Object.values(groupTypingTimeouts).forEach((timeoutId) => clearTimeout(timeoutId));
    };
  }, []);

  /* scroll to first unread in current conversation, fallback to bottom */
  const unreadInCurrentConversation = useMemo(() => {
    return notifications.filter((n) => {
      if (n.isRead) return false;

      if (selectedGroupId) {
        return (
          isGroupNotification(n) &&
          n.meta?.groupId?.toString() === selectedGroupId?.toString()
        );
      }

      if (selectedReceiverId) {
        return (
          isDirectNotification(n) &&
          n.meta?.senderId?.toString() === selectedReceiverId?.toString()
        );
      }

      return false;
    });
  }, [notifications, selectedGroupId, selectedReceiverId]);

  const firstUnreadTimestamp = useMemo(() => {
    if (unreadInCurrentConversation.length === 0) return null;
    const sorted = unreadInCurrentConversation
      .map((n) => n.meta?.timestamp || n.createdAt)
      .filter(Boolean)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    return sorted[0] || null;
  }, [unreadInCurrentConversation]);

  const firstUnreadMessageIndex = useMemo(() => {
    if (!firstUnreadTimestamp) return -1;
    const targetTime = new Date(firstUnreadTimestamp).getTime();

    return messages.findIndex((msg) => {
      if (msg.mine) return false;
      const messageTime = new Date(msg.timestamp).getTime();
      return messageTime >= targetTime;
    });
  }, [messages, firstUnreadTimestamp]);

  useEffect(() => {
    if (firstUnreadMessageIndex >= 0 && firstUnreadRef.current) {
      firstUnreadRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, firstUnreadMessageIndex]);

  /* ------------------------------------------------------------------ */
  /* 🔖 memoized menu items */
  const unreadDirectBySender = useMemo(() => {
    const map = {};
    notifications
      .filter((n) => !n.isRead && isDirectNotification(n))
      .forEach((n) => {
        const senderId = n.meta?.senderId || n.senderId;
        if (!senderId) return;
        const key = senderId.toString();
        map[key] = (map[key] || 0) + 1;
      });
    return map;
  }, [notifications]);

  const unreadDirectTotal = useMemo(
    () => Object.values(unreadDirectBySender).reduce((sum, count) => sum + count, 0),
    [unreadDirectBySender]
  );

  const unreadGroupById = useMemo(() => {
    const map = {};
    notifications
      .filter((n) => !n.isRead && isGroupNotification(n))
      .forEach((n) => {
        const groupId = n.meta?.groupId;
        if (!groupId) return;
        const key = groupId.toString();
        map[key] = (map[key] || 0) + 1;
      });
    return map;
  }, [notifications]);

  const unreadGroupsTotal = useMemo(
    () => Object.values(unreadGroupById).reduce((sum, count) => sum + count, 0),
    [unreadGroupById]
  );

  const isRtl = i18n.dir() === "rtl";
  const onlineBadgeOffset = useMemo(() => (isRtl ? [-2, 2] : [2, 2]), [isRtl]);
  const headerOnlineBadgeOffset = useMemo(() => (isRtl ? [-2, 30] : [2, 30]), [isRtl]);

  const userMenuItems = useMemo(
    () =>
      users
        .filter((u) => u.id !== currentUserId)
        .map((u) => {
          const unreadCount = unreadDirectBySender[u.id?.toString()] || 0;
          const userKey = u.id?.toString();
          const isOnline = Boolean(onlineUsers[userKey]);
          const isTyping = Boolean(typingUsers[userKey]);
          return {
            key: u.id.toString(),
            icon: (
              <Badge dot={isOnline} color="#52c41a" offset={onlineBadgeOffset}>
                <UserOutlined />
              </Badge>
            ),
            label: (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontWeight: 500,
                      }}
                    >
                      {u.email}
                    </span>
                    <Tag
                      bordered={false}
                      style={{
                        marginInlineStart: 0,
                        marginInlineEnd: 0,
                        fontSize: 11,
                        fontWeight: 700,
                        paddingInline: 8,
                        lineHeight: "18px",
                        flexShrink: 0,
                        color: isTyping
                          ? themeToken.colorWarning
                          : isOnline
                          ? themeToken.colorSuccess
                          : themeToken.colorTextDescription,
                        background: isTyping
                          ? themeToken.colorWarningBg
                          : isOnline
                          ? themeToken.colorSuccessBg
                          : themeToken.colorFillTertiary,
                      }}
                    >
                      {isTyping ? t("chat.typing") : isOnline ? t("chat.online") : t("chat.offline")}
                    </Tag>
                  </div>
                </div>
                {unreadCount > 0 && <Badge count={unreadCount} size="small" />}
              </div>
            ),
          };
        }),
    [
      users,
      currentUserId,
      unreadDirectBySender,
      onlineUsers,
      typingUsers,
      t,
      themeToken,
      onlineBadgeOffset,
    ]
  );

  const groupMenuItems = useMemo(
    () =>
      groups.map((g) => {
        const unreadCount = unreadGroupById[g.id?.toString()] || 0;
        return {
          key: g.id.toString(),
          icon: <TeamOutlined />,
          label: (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {g.name}
              </span>
              {unreadCount > 0 && <Badge count={unreadCount} size="small" />}
            </div>
          ),
        };
      }),
    [groups, unreadGroupById]
  );

  const selectedUserIdAsString = selectedReceiverId?.toString();
  const selectedGroupNameKey = normalizeGroupName(selectedGroup?.name);
  const isSelectedUserTyping = Boolean(
    selectedUserIdAsString && typingUsers[selectedUserIdAsString]
  );
  const selectedGroupTypingUsers = useMemo(() => {
    if (!selectedGroupNameKey) return [];
    const groupTyping = typingUsersInGroup[selectedGroupNameKey] || {};
    return Object.keys(groupTyping)
      .map((typingUserId) => users.find((u) => u.id?.toString() === typingUserId)?.email)
      .filter(Boolean);
  }, [selectedGroupNameKey, typingUsersInGroup, users]);

  const conversationTitle = selectedGroup
    ? selectedGroup.name
    : selectedUser?.email || t("chat.direct_messages");

  const conversationSubtitle = selectedGroup
    ? selectedGroupTypingUsers.length > 0
      ? `${selectedGroupTypingUsers.join(", ")} ${t("chat.typing")}`
      : t("chat.group_chat")
    : isSelectedUserTyping
    ? t("chat.typing")
    : onlineUsers[selectedUserIdAsString]
    ? t("chat.online")
    : t("chat.offline");

  /* ------------------------------------------------------------------ */
  /* 📡 initial data */
  useEffect(() => {
    (async () => {
      try {
        setUsers(await getAllUsers());
        setGroups(await getGroupsUser());

        const onlineIds = await getOnlineUsers();
        const map = (onlineIds || []).reduce((acc, id) => {
          const key = id?.toString();
          if (key) acc[key] = true;
          return acc;
        }, {});
        setOnlineUsers(map);
      } catch (e) {
        console.error("load error:", e);
      }
    })();
  }, []);

  /* ------------------------------------------------------------------ */
  /* 📡 load direct‑chat messages */
  useEffect(() => {
    if (!selectedReceiverId) return;
    (async () => {
      try {
        setMessagesLoading(true);
        const data = await getPrivateMessages(selectedReceiverId);
        setMessages(mapMessages(extractMessageRows(data), currentUserId));
      } catch (e) {
        console.error("direct msgs error:", e);
      } finally {
        setMessagesLoading(false);
      }
    })();
  }, [selectedReceiverId, currentUserId]);

  useEffect(() => {
    if (!selectedReceiverId || messagesLoading) return;

    const hasUnreadIncoming = messages.some(
      (msg) => !msg.mine && !msg.chatGroupId && !msg.isRead
    );
    if (!hasUnreadIncoming) return;

    (async () => {
      try {
        await markPrivateMessagesAsRead(selectedReceiverId);
        const readAt = new Date().toISOString();
        setMessages((prev) =>
          prev.map((msg) =>
            !msg.mine && !msg.chatGroupId
              ? { ...msg, isRead: true, readAt: msg.readAt || readAt }
              : msg
          )
        );
        await markConversationAsRead({ senderId: selectedReceiverId });
      } catch (e) {
        console.error("mark private read error:", e);
      }
    })();
  }, [selectedReceiverId, messages, messagesLoading, markConversationAsRead]);

  /* ------------------------------------------------------------------ */
  /* 📡 join group + load history */
  const joinGroup = useCallback(
    async (groupId) => {
      if (!hub) return;
      await hub.invoke("JoinGroup", groupId.toString());

      setSelectedGroupId(groupId);
      setSelectedReceiverId(null);

      try {
        setMessagesLoading(true);
        const rows = await getMassegesGroups(groupId);
        setMessages(mapMessages(extractMessageRows(rows), currentUserId));
      } catch (e) {
        console.error("group msgs error:", e);
      } finally {
        setMessagesLoading(false);
      }
    },
    [hub, currentUserId]
  );

  useEffect(() => {
    if (routeUserId) {
      setSelectedReceiverId(routeUserId.toString());
      setSelectedGroupId(null);
      return;
    }

    if (routeGroupId && hub) {
      joinGroup(routeGroupId.toString());
    }
  }, [routeUserId, routeGroupId, hub, joinGroup]);

  useEffect(() => {
    if (!selectedGroupId || messagesLoading) return;

    const hasUnreadIncoming = messages.some(
      (msg) => !msg.mine && msg.chatGroupId?.toString() === selectedGroupId?.toString() && !msg.isRead
    );
    if (!hasUnreadIncoming) return;

    (async () => {
      try {
        await markGroupMessagesAsRead(selectedGroupId);
        const readAt = new Date().toISOString();
        setMessages((prev) =>
          prev.map((msg) =>
            !msg.mine && msg.chatGroupId?.toString() === selectedGroupId?.toString()
              ? { ...msg, isRead: true, readAt: msg.readAt || readAt }
              : msg
          )
        );
        await markConversationAsRead({ groupId: selectedGroupId });
      } catch (e) {
        console.error("mark group read error:", e);
      }
    })();
  }, [selectedGroupId, messages, messagesLoading, markConversationAsRead]);

  /* ------------------------------------------------------------------ */
  /* 📨 send */
  const sendMessage = useCallback(async () => {
    if (!message.trim()) return;
    try {
      await sendMessages(
        message,
        selectedGroupId ? null : selectedReceiverId,
        selectedGroupId ? Number(selectedGroupId) : null
      );
      setMessage("");

      if (hub?.state === "Connected") {
        if (selectedGroupId) {
          await hub.invoke("StopTypingInGroup", selectedGroup?.name);
        } else if (selectedReceiverId) {
          await hub.invoke("StopTyping", selectedReceiverId);
        }
      }
    } catch (e) {
      console.error("send error:", e);
    }
  }, [
    message,
    selectedGroupId,
    selectedReceiverId,
    hub,
    selectedGroup,
  ]);

  useEffect(() => {
    if (!hub || hub.state !== "Connected") return;

    const notifyTypingState = async () => {
      const hasText = Boolean(message.trim());

      try {
        if (selectedGroupId) {
          await hub.invoke(
            hasText ? "TypingInGroup" : "StopTypingInGroup",
            selectedGroup?.name
          );
          return;
        }

        if (selectedReceiverId) {
          await hub.invoke(hasText ? "Typing" : "StopTyping", selectedReceiverId);
        }
      } catch {
        // no-op if backend does not expose matching invoke methods
      }
    };

    if (typingEmitTimeoutRef.current) {
      clearTimeout(typingEmitTimeoutRef.current);
    }

    typingEmitTimeoutRef.current = setTimeout(() => {
      notifyTypingState();
    }, 280);

    return () => {
      if (typingEmitTimeoutRef.current) {
        clearTimeout(typingEmitTimeoutRef.current);
      }
    };
  }, [hub, message, selectedGroupId, selectedReceiverId, selectedGroup]);

  /* ------------------------------------------------------------------ */
  /* 🔍 search */
  const handleSearch = useCallback(async (q = searchQuery) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setSearchResults(null);
      return;
    }

    try {
      setSearchLoading(true);
      const payload = await searchMessages(trimmed);
      const rows = extractMessageRows(payload);
      setSearchResults(rows);
    } catch (e) {
      console.error("search error:", e);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery]);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults(null);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 80);
    }
  }, [searchOpen]);

  /* ------------------------------------------------------------------ */
  /* ➕ create group */
  const handleCreateGroup = useCallback(async () => {
    if (!newGroupName.trim() || selectedMemberIds.length === 0) return;
    try {
      const g = await createGroub(newGroupName, selectedMemberIds);
      setGroups((prev) => [...prev, g]);
      setShowCreateGroup(false);
      setNewGroupName("");
      setSelectedMemberIds([]);
    } catch (e) {
      console.error("create group error:", e);
    }
  }, [newGroupName, selectedMemberIds]);

  /* =================================================================== */
  /* UI */
  return (
    <>
      <Layout style={{ height: "100%" }}>
        {/* ========== Sidebar ========== */}
        <Sider
          width={270}
          style={{
            background: themeToken.colorBgContainer,
            borderRight: `1px solid ${themeToken.colorBorderSecondary}`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              overflowY: "auto",
              height: "100%",
              padding: "12px 8px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 8px",
                marginBottom: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Typography.Text strong style={{ fontSize: 13, opacity: 0.6, letterSpacing: 1 }}>
                  {t("chat.groups")}
                </Typography.Text>
                {unreadGroupsTotal > 0 && <Badge count={unreadGroupsTotal} size="small" />}
              </div>
              <Button
                type="text"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => setShowCreateGroup(true)}
                title={t("chat.create_group")}
              />
            </div>
            <Menu
              mode="inline"
              selectedKeys={[selectedGroupId?.toString()]}
              items={groupMenuItems}
              onClick={async ({ key }) => {
                await markConversationAsRead({ groupId: key });
                navigate(`/chat/group/${key}`);
              }}
              style={{ border: "none" }}
            />

            <Divider style={{ margin: "12px 0" }} />

            <div style={{ padding: "0 8px", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography.Text strong style={{ fontSize: 13, opacity: 0.6, letterSpacing: 1 }}>
                  {t("chat.direct_messages")}
                </Typography.Text>
                {unreadDirectTotal > 0 && (
                  <Badge count={unreadDirectTotal} size="small" />
                )}
              </div>
            </div>
            <Menu
              mode="inline"
              selectedKeys={[selectedReceiverId?.toString()]}
              items={userMenuItems}
              onClick={async ({ key }) => {
                await markConversationAsRead({ senderId: key });
                navigate(`/chat/user/${key}`);
              }}
              style={{ border: "none" }}
            />
          </div>
        </Sider>

        {/* ========== Chat Area ========== */}
        <Layout style={{ background: themeToken.colorBgLayout }}>
          <Content
            style={{
              padding: 0,
              display: "flex",
              flexDirection: "column",
              height: "100%",
              overflow: "hidden",
              borderRadius: 16,
            }}
          >
            {/* No conversation selected */}
            {!selectedReceiverId && !selectedGroupId ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: 16,
                  opacity: 0.5,
                }}
              >
                <WechatOutlined style={{ fontSize: 72 }} />
                <Typography.Text style={{ fontSize: 16 }}>
                  {t("chat.select_conversation")}
                </Typography.Text>
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 20px",
                    borderBottom: `1px solid ${themeToken.colorBorderSecondary}`,
                    background: themeToken.colorBgContainer,
                  }}
                >
                  <Badge
                    dot={!selectedGroup && Boolean(onlineUsers[selectedUserIdAsString])}
                    color="#52c41a"
                    offset={headerOnlineBadgeOffset}
                  >
                    <Avatar
                      icon={selectedGroup ? <TeamOutlined /> : <UserOutlined />}
                      style={{
                        background: selectedGroup
                          ? "linear-gradient(140deg, #722ed1 0%, #9254de 100%)"
                          : "linear-gradient(140deg, #1677ff 0%, #69b1ff 100%)",
                      }}
                    />
                  </Badge>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Typography.Text strong ellipsis style={{ display: "block" }}>
                      {conversationTitle}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {conversationSubtitle}
                    </Typography.Text>
                  </div>

                  {/* Search toggle */}
                  <Tooltip title={t("chat.search_messages")}>
                    <Button
                      type="text"
                      shape="circle"
                      icon={searchOpen ? <CloseOutlined /> : <SearchOutlined />}
                      onClick={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
                    />
                  </Tooltip>
                </div>

                {/* ── Search bar ── */}
                {searchOpen && (
                  <div
                    style={{
                      padding: "8px 20px",
                      borderBottom: `1px solid ${themeToken.colorBorderSecondary}`,
                      background: themeToken.colorBgContainer,
                      display: "flex",
                      gap: 8,
                    }}
                  >
                    <Input
                      ref={searchInputRef}
                      prefix={<SearchOutlined style={{ opacity: 0.45 }} />}
                      placeholder={t("chat.search_placeholder")}
                      value={searchQuery}
                      allowClear
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (!e.target.value.trim()) setSearchResults(null);
                      }}
                      onPressEnter={() => handleSearch()}
                      style={{ borderRadius: 20 }}
                    />
                    <Button
                      type="primary"
                      loading={searchLoading}
                      icon={<SearchOutlined />}
                      onClick={() => handleSearch()}
                      disabled={!searchQuery.trim()}
                    >
                      {t("chat.search_btn")}
                    </Button>
                  </div>
                )}

                {/* messages list */}
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "18px 24px",
                    background:
                      "radial-gradient(circle at 20% 0%, rgba(22,119,255,0.07), transparent 40%)",
                  }}
                >
                  {/* ── Search results ── */}
                  {searchOpen && searchResults !== null ? (
                    searchLoading ? (
                      <div style={{ textAlign: "center", paddingTop: 40 }}>
                        <Spin size="large" />
                      </div>
                    ) : searchResults.length === 0 ? (
                      <Empty
                        description={t("chat.search_no_results")}
                        style={{ marginTop: 60 }}
                      />
                    ) : (
                      <>
                        <Typography.Text
                          type="secondary"
                          style={{ display: "block", marginBottom: 12, fontSize: 12 }}
                        >
                          {searchResults.length} {t("chat.search_results_count")}
                        </Typography.Text>
                        <List
                          dataSource={searchResults}
                          renderItem={(msg) => {
                            const isMe = msg.senderId === currentUserId;
                            const time = new Date(msg.timestamp).toLocaleTimeString("ar-EG", {
                              hour: "2-digit",
                              minute: "2-digit",
                            });
                            const content = msg.content || "";
                            const idx = content.toLowerCase().indexOf(searchQuery.toLowerCase());
                            const highlighted =
                              idx >= 0 ? (
                                <>
                                  {content.slice(0, idx)}
                                  <mark
                                    style={{
                                      background: themeToken.colorWarning,
                                      color: themeToken.colorBgContainer,
                                      borderRadius: 3,
                                      padding: "0 2px",
                                    }}
                                  >
                                    {content.slice(idx, idx + searchQuery.length)}
                                  </mark>
                                  {content.slice(idx + searchQuery.length)}
                                </>
                              ) : (
                                content
                              );

                            return (
                              <List.Item
                                style={{
                                  display: "flex",
                                  justifyContent: isMe ? "flex-end" : "flex-start",
                                  border: "none",
                                  padding: "4px 0",
                                }}
                              >
                                {!isMe && (
                                  <Avatar
                                    icon={<UserOutlined />}
                                    size={32}
                                    style={{ marginRight: 8, flexShrink: 0, alignSelf: "flex-end" }}
                                  />
                                )}
                                <div
                                  style={{
                                    maxWidth: "65%",
                                    padding: "10px 14px",
                                    borderRadius: isMe
                                      ? "18px 18px 4px 18px"
                                      : "18px 18px 18px 4px",
                                    background: isMe
                                      ? themeToken.colorPrimary
                                      : themeToken.colorBgElevated,
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
                                    color: isMe ? "#fff" : themeToken.colorText,
                                  }}
                                >
                                  {!isMe && (
                                    <div
                                      style={{
                                        fontWeight: 600,
                                        fontSize: 12,
                                        marginBottom: 3,
                                        opacity: 0.75,
                                      }}
                                    >
                                      {msg.senderName}
                                    </div>
                                  )}
                                  <div style={{ lineHeight: 1.5 }}>{highlighted}</div>
                                  <div
                                    style={{
                                      fontSize: 11,
                                      textAlign: "right",
                                      marginTop: 4,
                                      opacity: 0.6,
                                    }}
                                  >
                                    {time}
                                  </div>
                                </div>
                                {isMe && (
                                  <Avatar
                                    icon={<UserOutlined />}
                                    size={32}
                                    style={{
                                      marginLeft: 8,
                                      flexShrink: 0,
                                      alignSelf: "flex-end",
                                      background: themeToken.colorPrimary,
                                    }}
                                  />
                                )}
                              </List.Item>
                            );
                          }}
                        />
                      </>
                    )
                  ) : messagesLoading ? (
                    <div style={{ textAlign: "center", paddingTop: 40 }}>
                      <Spin size="large" />
                    </div>
                  ) : messages.length === 0 ? (
                    <Empty
                      description={t("chat.no_messages")}
                      style={{ marginTop: 60 }}
                    />
                  ) : (
                    <List
                      dataSource={messages}
                      renderItem={(msg, index) => {
                        const isMe = msg.mine;
                        const bubbleBg = isMe
                          ? themeToken.colorPrimary
                          : themeToken.colorBgElevated;
                        const bubbleColor = isMe
                          ? "#fff"
                          : themeToken.colorText;
                        const messageIsRead = Boolean(msg.isRead || msg.readAt);
                        const time = new Date(msg.timestamp).toLocaleTimeString(
                          "ar-EG",
                          { hour: "2-digit", minute: "2-digit" }
                        );

                        return (
                          <List.Item
                            style={{
                              display: "flex",
                              justifyContent: isMe ? "flex-end" : "flex-start",
                              border: "none",
                              padding: "4px 0",
                            }}
                          >
                            {!isMe && (
                              <Avatar
                                icon={<UserOutlined />}
                                size={32}
                                style={{ marginRight: 8, flexShrink: 0, alignSelf: "flex-end" }}
                              />
                            )}
                            <div
                              ref={index === firstUnreadMessageIndex ? firstUnreadRef : null}
                              style={{
                                maxWidth: "65%",
                                padding: "10px 14px",
                                borderRadius: isMe
                                  ? "18px 18px 4px 18px"
                                  : "18px 18px 18px 4px",
                                background: bubbleBg,
                                boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
                                color: bubbleColor,
                              }}
                            >
                              {!isMe && (
                                <div
                                  style={{
                                    fontWeight: 600,
                                    fontSize: 12,
                                    marginBottom: 3,
                                    opacity: 0.75,
                                    color: bubbleColor,
                                  }}
                                >
                                  {msg.senderName}
                                </div>
                              )}
                              <div style={{ color: bubbleColor, lineHeight: 1.5 }}>
                                {msg.content}
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "flex-end",
                                  gap: 4,
                                  marginTop: 4,
                                  opacity: 0.6,
                                  color: bubbleColor,
                                }}
                              >
                                {isMe && (
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: 0 }}>
                                    <CheckOutlined style={{ fontSize: 10 }} />
                                    {messageIsRead && (
                                      <CheckOutlined style={{ fontSize: 10, marginInlineStart: -4 }} />
                                    )}
                                  </span>
                                )}
                                {time}
                              </div>
                            </div>
                            {isMe && (
                              <Avatar
                                icon={<UserOutlined />}
                                size={32}
                                style={{
                                  marginLeft: 8,
                                  flexShrink: 0,
                                  alignSelf: "flex-end",
                                  background: themeToken.colorPrimary,
                                }}
                              />
                            )}
                          </List.Item>
                        );
                      }}
                    />
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* composer */}
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    padding: "14px 20px",
                    borderTop: `1px solid ${themeToken.colorBorderSecondary}`,
                    background: themeToken.colorBgContainer,
                  }}
                >
                  <TextArea
                    rows={1}
                    placeholder={t("chat.write_message")}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onPressEnter={(e) => {
                      e.preventDefault();
                      sendMessage();
                    }}
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    style={{ resize: "none", borderRadius: 20, paddingTop: 8, paddingBottom: 8 }}
                  />
                  <Button
                    type="primary"
                    shape="circle"
                    size="large"
                    icon={<SendOutlined />}
                    onClick={sendMessage}
                    disabled={!message.trim()}
                  />
                </div>
              </>
            )}
          </Content>
        </Layout>
      </Layout>

      {/* ========== Create Group Modal ========== */}
      <Modal
        title={t("chat.create_group_title")}
        open={showCreateGroup}
        okText={t("common.create")}
        cancelText={t("common.cancel")}
        onCancel={() => setShowCreateGroup(false)}
        onOk={handleCreateGroup}
      >
        <Input
          placeholder={t("chat.group_name_placeholder")}
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
        />

        <div style={{ marginTop: 16 }}>
          <label>{t("chat.select_members")}</label>
          <Checkbox.Group
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 8,
              maxHeight: 200,
              overflowY: "auto",
            }}
            value={selectedMemberIds}
            onChange={setSelectedMemberIds}
          >
            {users
              .filter((u) => u.id !== currentUserId)
              .map((u) => (
                <Checkbox key={u.id} value={u.id}>
                  {u.email}
                </Checkbox>
              ))}
          </Checkbox.Group>
        </div>
      </Modal>
    </>
  );
}
