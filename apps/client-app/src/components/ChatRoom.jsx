// src/components/ChatRoom.jsx
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { HubConnectionBuilder } from "@microsoft/signalr";
import { jwtDecode } from "jwt-decode";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";

import {
  getAllUsers,
  getPrivateMessages,
  getGroupsUser,
  getMassegesGroups,
  createGroub,
  sendMessages,
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
} from "antd";
import {
  UserOutlined,
  TeamOutlined,
  PlusOutlined,
  SendOutlined,
  WechatOutlined,
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
    senderId: m.senderId,
    senderName: m.senderName,
    content: m.content,
    mine: m.senderId === currentUserId,
    timestamp: m.timestamp,
  }));
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
  const { t } = useTranslation();
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

  /* new‑group modal */
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);

  /* scroll‑bottom ref */
  const bottomRef = useRef(null);
  const firstUnreadRef = useRef(null);
  const { token: themeToken } = theme.useToken();

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

  /* ------------------------------------------------------------------ */
  /* 📥 listeners */
  useEffect(() => {
    if (!hub) return;

    const onReceivePrivate = (senderId, senderName, content, timestamp) => {
      setMessages((prev) => [
        ...prev,
        {
          senderId,
          senderName,
          content,
          mine: senderId === currentUserId,
          timestamp,
        },
      ]);

      if (senderId !== currentUserId) {
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
      setMessages((prev) => [
        ...prev,
        {
          senderId,
          senderName,
          content,
          mine: senderId === currentUserId,
          timestamp,
        },
      ]);

      if (senderId !== currentUserId) {
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

    hub.on("ReceivePrivateMessage", onReceivePrivate);
    hub.on("ReceiveGroupMessage", onReceiveGroup);
    hub.on("ReceiveMessage", onReceivePrivate);

    return () => {
      hub.off("ReceivePrivateMessage", onReceivePrivate);
      hub.off("ReceiveGroupMessage", onReceiveGroup);
      hub.off("ReceiveMessage", onReceivePrivate);
    };
  }, [hub, currentUserId, pushNotification, t]);

  /* scroll to first unread in current conversation, fallback to bottom */
  const unreadInCurrentConversation = useMemo(() => {
    return notifications.filter((n) => {
      if (n.isRead) return false;
      const notificationType = n.meta?.conversationType;

      if (selectedGroupId) {
        return (
          (notificationType === "group" || n.meta?.groupId) &&
          n.meta?.groupId?.toString() === selectedGroupId?.toString()
        );
      }

      if (selectedReceiverId) {
        return (
          (notificationType === "direct" || n.meta?.senderId) &&
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
      .filter((n) => !n.isRead)
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
      .filter((n) => !n.isRead)
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

  const userMenuItems = useMemo(
    () =>
      users
        .filter((u) => u.id !== currentUserId)
        .map((u) => {
          const unreadCount = unreadDirectBySender[u.id?.toString()] || 0;
          return {
            key: u.id.toString(),
            icon: <UserOutlined />,
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
                  {u.email}
                </span>
                {unreadCount > 0 && <Badge count={unreadCount} size="small" />}
              </div>
            ),
          };
        }),
    [users, currentUserId, unreadDirectBySender]
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

  const selectedUser = useMemo(
    () => users.find((u) => u.id?.toString() === selectedReceiverId?.toString()),
    [users, selectedReceiverId]
  );

  const selectedGroup = useMemo(
    () => groups.find((g) => g.id?.toString() === selectedGroupId?.toString()),
    [groups, selectedGroupId]
  );

  const conversationTitle = selectedGroup
    ? selectedGroup.name
    : selectedUser?.email || t("chat.direct_messages");

  const conversationSubtitle = selectedGroup
    ? t("chat.group_chat")
    : t("chat.direct_chat");

  /* ------------------------------------------------------------------ */
  /* 📡 initial data */
  useEffect(() => {
    (async () => {
      try {
        setUsers(await getAllUsers());
        setGroups(await getGroupsUser());
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
        setMessages(mapMessages(data, currentUserId));
      } catch (e) {
        console.error("direct msgs error:", e);
      } finally {
        setMessagesLoading(false);
      }
    })();
  }, [selectedReceiverId, currentUserId]);

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
        setMessages(mapMessages(rows, currentUserId));
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
    } catch (e) {
      console.error("send error:", e);
    }
  }, [message, selectedGroupId, selectedReceiverId]);

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
                  <Avatar
                    icon={selectedGroup ? <TeamOutlined /> : <UserOutlined />}
                    style={{
                      background: selectedGroup
                        ? "linear-gradient(140deg, #722ed1 0%, #9254de 100%)"
                        : "linear-gradient(140deg, #1677ff 0%, #69b1ff 100%)",
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Typography.Text strong ellipsis style={{ display: "block" }}>
                      {conversationTitle}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {conversationSubtitle}
                    </Typography.Text>
                  </div>
                </div>

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
                  {messagesLoading ? (
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
                                  textAlign: "right",
                                  marginTop: 4,
                                  opacity: 0.6,
                                  color: bubbleColor,
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
