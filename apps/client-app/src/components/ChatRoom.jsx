// src/components/ChatRoom.jsx
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { HubConnectionBuilder } from "@microsoft/signalr";
import { jwtDecode } from "jwt-decode";

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
} from "antd";
import {
  UserOutlined,
  TeamOutlined,
  MessageOutlined,
  PlusOutlined,
} from "@ant-design/icons";

import { AUTH_CONFIG } from "../config/env";
import "./ChatRoom.css";

const { Sider, Content } = Layout;
const { TextArea } = Input;
const { Title } = Typography;

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

  /* new‑group modal */
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);

  /* scroll‑bottom ref */
  const bottomRef = useRef(null);

  /* ------------------------------------------------------------------ */
  /* 🔌 SignalR connection (once) */
  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl("https://localhost:7152/chatHub", {
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

    const onReceive = (senderId, senderName, content, timestamp) =>
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

    hub.on("ReceivePrivateMessage", onReceive);
    hub.on("ReceiveGroupMessage", onReceive);
    hub.on("ReceiveMessage", onReceive);

    return () => {
      hub.off("ReceivePrivateMessage", onReceive);
      hub.off("ReceiveGroupMessage", onReceive);
      hub.off("ReceiveMessage", onReceive);
    };
  }, [hub, currentUserId]);

  /* auto‑scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ------------------------------------------------------------------ */
  /* 🔖 memoized menu items */
  const userMenuItems = useMemo(
    () =>
      users
        .filter((u) => u.id !== currentUserId)
        .map((u) => ({
          key: u.id.toString(),
          icon: <UserOutlined />,
          label: u.email,
        })),
    [users, currentUserId]
  );

  const groupMenuItems = useMemo(
    () =>
      groups.map((g) => ({
        key: g.id.toString(),
        icon: <TeamOutlined />,
        label: g.name,
      })),
    [groups]
  );

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
        const data = await getPrivateMessages(selectedReceiverId);
        setMessages(mapMessages(data, currentUserId));
      } catch (e) {
        console.error("direct msgs error:", e);
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
        const rows = await getMassegesGroups(groupId);
        setMessages(mapMessages(rows, currentUserId));
      } catch (e) {
        console.error("group msgs error:", e);
      }
    },
    [hub, currentUserId]
  );

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
      <Layout style={{ height: "100vh" }}>
        {/* ========== Sidebar ========== */}
        <Sider width={260} style={{ background: "#fff", padding: 16 }}>
          <Title level={4}>📁 المجموعات</Title>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            block
            style={{ marginBottom: 12 }}
            onClick={() => setShowCreateGroup(true)}
          >
            إنشاء مجموعة
          </Button>

          <Menu
            mode="inline"
            selectedKeys={[selectedGroupId?.toString()]}
            items={groupMenuItems}
            onClick={({ key }) => joinGroup(key)}
          />

          <Divider />

          <Title level={4}>👥 المستخدمين</Title>
          <Menu
            mode="inline"
            selectedKeys={[selectedReceiverId?.toString()]}
            items={userMenuItems}
            onClick={({ key }) => {
              setSelectedReceiverId(key);
              setSelectedGroupId(null);
            }}
          />
        </Sider>

        {/* ========== Chat Area ========== */}
        <Layout>
          <Content
            style={{
              padding: 16,
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            {/* messages list */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                background: "#fafafa",
                borderRadius: 8,
                padding: 12,
              }}
            >
              <List
                dataSource={messages}
                renderItem={(msg) => {
                  const isMe = msg.mine;
                  const bubble = {
                    maxWidth: "70%",
                    padding: "10px 14px",
                    borderRadius: 18,
                    background: isMe ? "#DCF8C6" : "#FFF",
                    boxShadow: "0 0 4px rgba(0,0,0,0.05)",
                  };
                  const time = new Date(msg.timestamp).toLocaleString("ar-EG", {
                    dateStyle: "short",
                    timeStyle: "short",
                  });

                  return (
                    <List.Item
                      style={{
                        display: "flex",
                        justifyContent: isMe ? "flex-end" : "flex-start",
                      }}
                    >
                      <div style={bubble}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>
                          {isMe ? `أنا (${msg.senderName})` : msg.senderName}
                        </div>
                        <div>{msg.content}</div>
                        <div
                          style={{
                            fontSize: 12,
                            textAlign: "right",
                            color: "#666",
                            marginTop: 6,
                          }}
                        >
                          {time}
                        </div>
                      </div>
                    </List.Item>
                  );
                }}
              />
              <div ref={bottomRef} />
            </div>

            {/* composer */}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <TextArea
                rows={1}
                placeholder="اكتب رسالة..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onPressEnter={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                style={{ resize: "none" }}
              />
              <Button
                type="primary"
                icon={<MessageOutlined />}
                onClick={sendMessage}
              >
                إرسال
              </Button>
            </div>
          </Content>
        </Layout>
      </Layout>

      {/* ========== Create Group Modal ========== */}
      <Modal
        title="إنشاء مجموعة جديدة"
        open={showCreateGroup}
        okText="إنشاء"
        cancelText="إلغاء"
        onCancel={() => setShowCreateGroup(false)}
        onOk={handleCreateGroup}
      >
        <Input
          placeholder="اسم المجموعة"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
        />

        <div style={{ marginTop: 16 }}>
          <label>اختر الأعضاء:</label>
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
