import { useState, useMemo, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { Col, Layout, Menu, Row, Button, Tooltip, theme, Badge, Popover, List, Typography, Space, Segmented, Spin, Input } from "antd";
import { LogoutOutlined, MessageFilled, TeamOutlined, SettingOutlined, BellOutlined, CheckOutlined, DeleteOutlined, UserOutlined, SyncOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import DarkModeSwitch from "../components/DarkModeSwitch";
import LocalizationButton from "../components/LocalizationButton";
import { useAuth } from "../contexts/Auth";
import { useNotifications } from "../contexts/Notifications";
import { revokeAuthToken } from "../services/api";
import { clearAuthSession, getRefreshToken } from "../utils/authSession";

const { Header, Content, Sider } = Layout;

function getItem(label, key, icon, children, type) {
  return {
    label,
    key,
    icon,
    children,
    type,
  };
}

export default function ProtectedRoute() {
  const { setAuth } = useAuth();
  const { t, i18n } = useTranslation();
  const {
    notifications,
    unreadCount,
    isLoadingNotifications,
    reloadNotifications,
    markAsRead,
    markAllAsRead,
    markConversationAsRead,
    clearNotifications,
  } = useNotifications();

  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationsFilter, setNotificationsFilter] = useState("all");
  const [notificationsSearch, setNotificationsSearch] = useState("");

  const handleLogout = async () => {
    const refreshToken = getRefreshToken();

    try {
      if (refreshToken) {
        await revokeAuthToken(refreshToken);
      }
    } catch {
      // Logout should still continue locally even if revoke fails.
    } finally {
      clearAuthSession();
      setAuth(false);
      navigate("/login");
    }
  };

  const menuItems = useMemo(
    () => [
          getItem(t("layout.chat_room"), "/chat", <MessageFilled />),
          getItem(t("layout.users"), "/users", <UserOutlined />),
          getItem(t("layout.groups"), "/groups", <TeamOutlined />),
          getItem(t("layout.settings"), "/settings", <SettingOutlined />),
    ],
    [t]
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth < 1200) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isNotificationsOpen) {
      reloadNotifications();
    }
  }, [isNotificationsOpen, reloadNotifications]);

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const filteredNotifications = useMemo(() => {
    let rows = notifications;

    if (notificationsFilter === "unread") {
      rows = rows.filter((item) => !item.isRead);
    } else if (notificationsFilter === "direct") {
      rows = rows.filter((item) => {
        const type = item.meta?.conversationType;
        return type === "direct" || Boolean(item.meta?.senderId);
      });
    } else if (notificationsFilter === "groups") {
      rows = rows.filter((item) => {
        const type = item.meta?.conversationType;
        return type === "group" || Boolean(item.meta?.groupId);
      });
    }

    const query = notificationsSearch.trim().toLowerCase();
    if (!query) return rows;

    return rows.filter((item) => {
      const sender = (item.meta?.senderName || item.senderName || item.title || "").toLowerCase();
      const title = (item.title || "").toLowerCase();
      const description = (item.description || "").toLowerCase();
      return sender.includes(query) || title.includes(query) || description.includes(query);
    });
  }, [notifications, notificationsFilter, notificationsSearch]);

  const sortedNotifications = useMemo(() => {
    return [...filteredNotifications].sort((a, b) => {
      if (a.isRead !== b.isRead) {
        return a.isRead ? 1 : -1;
      }

      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [filteredNotifications]);

  const groupedNotifications = useMemo(() => {
    const today = [];
    const yesterday = [];
    const older = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    sortedNotifications.forEach((item) => {
      const itemDate = new Date(item.createdAt || 0);
      if (Number.isNaN(itemDate.getTime())) {
        older.push(item);
        return;
      }

      if (itemDate >= startOfToday) {
        today.push(item);
        return;
      }

      if (itemDate >= startOfYesterday && itemDate < startOfToday) {
        yesterday.push(item);
        return;
      }

      older.push(item);
    });

    const result = [];
    if (today.length) {
      result.push({ type: "header", key: "header-today", label: t("notifications.section_today") });
      today.forEach((item) => result.push({ type: "item", key: `item-${item.id}`, value: item }));
    }
    if (yesterday.length) {
      result.push({ type: "header", key: "header-yesterday", label: t("notifications.section_yesterday") });
      yesterday.forEach((item) => result.push({ type: "item", key: `item-${item.id}`, value: item }));
    }
    if (older.length) {
      result.push({ type: "header", key: "header-older", label: t("notifications.section_older") });
      older.forEach((item) => result.push({ type: "item", key: `item-${item.id}`, value: item }));
    }

    return result;
  }, [sortedNotifications, t]);

  const formatNotificationTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleString(i18n.language === "ar" ? "ar-EG" : "en-US", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const notificationsStats = useMemo(() => {
    const all = notifications.length;
    const unread = notifications.filter((item) => !item.isRead).length;
    const direct = notifications.filter((item) => {
      const type = item.meta?.conversationType;
      return type === "direct" || Boolean(item.meta?.senderId);
    }).length;
    const groups = notifications.filter((item) => {
      const type = item.meta?.conversationType;
      return type === "group" || Boolean(item.meta?.groupId);
    }).length;

    return { all, unread, direct, groups };
  }, [notifications]);

  const handleNotificationClick = async (item) => {
    const groupId = item.meta?.groupId;
    const senderId = item.meta?.senderId;

    if (groupId) {
      await markConversationAsRead({ groupId });
      navigate(`/chat/group/${groupId}`);
      setIsNotificationsOpen(false);
      return;
    }

    if (senderId) {
      await markConversationAsRead({ senderId });
      navigate(`/chat/user/${senderId}`);
      setIsNotificationsOpen(false);
      return;
    }

    await markAsRead(item.id);
  };

  const notificationsOverlay = (
    <div
      style={{
        width: 360,
        maxHeight: 460,
        overflow: "hidden",
        borderRadius: 10,
        background: colorBgContainer,
        boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 12px",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <Typography.Text strong>{t("notifications.title")}</Typography.Text>
        <Space size={6}>
          <Button
            size="small"
            type="text"
            icon={<SyncOutlined spin={isLoadingNotifications} />}
            onClick={reloadNotifications}
          >
            {t("notifications.refresh")}
          </Button>
          <Button
            size="small"
            type="text"
            icon={<CheckOutlined />}
            onClick={markAllAsRead}
          >
            {t("notifications.mark_all")}
          </Button>
          <Button
            size="small"
            type="text"
            icon={<DeleteOutlined />}
            onClick={clearNotifications}
          >
            {t("notifications.clear")}
          </Button>
        </Space>
      </div>
      <div style={{ maxHeight: 390, overflowY: "auto" }}>
        <div style={{ padding: "8px 12px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <Segmented
            block
            size="small"
            value={notificationsFilter}
            onChange={setNotificationsFilter}
            options={[
              {
                label: `${t("notifications.filter_all")} (${notificationsStats.all})`,
                value: "all",
              },
              {
                label: `${t("notifications.filter_unread")} (${notificationsStats.unread})`,
                value: "unread",
              },
              {
                label: `${t("notifications.filter_direct")} (${notificationsStats.direct})`,
                value: "direct",
              },
              {
                label: `${t("notifications.filter_groups")} (${notificationsStats.groups})`,
                value: "groups",
              },
            ]}
          />
          <Input
            size="small"
            allowClear
            value={notificationsSearch}
            onChange={(e) => setNotificationsSearch(e.target.value)}
            placeholder={t("notifications.search")}
            style={{ marginTop: 8 }}
          />
        </div>
        {isLoadingNotifications ? (
          <div style={{ padding: "28px 0", textAlign: "center" }}>
            <Spin />
          </div>
        ) : (
          <List
            dataSource={groupedNotifications}
            locale={{ emptyText: t("notifications.empty") }}
            renderItem={(entry) => {
            if (entry.type === "header") {
              return (
                <List.Item style={{ padding: "6px 12px", border: "none", cursor: "default" }}>
                  <Typography.Text
                    type="secondary"
                    style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8 }}
                  >
                    {entry.label}
                  </Typography.Text>
                </List.Item>
              );
            }

            const item = entry.value;
            return (
              <List.Item
                style={{
                  padding: "10px 12px",
                  cursor: "pointer",
                  background: item.isRead ? "transparent" : "rgba(22,119,255,0.08)",
                }}
                onClick={() => handleNotificationClick(item)}
              >
                <List.Item.Meta
                  title={
                    <Space size={8}>
                      {!item.isRead && <Badge status="processing" />}
                      <Typography.Text strong={!item.isRead}>
                        {item.meta?.senderName || item.senderName || item.title}
                      </Typography.Text>
                    </Space>
                  }
                  description={
                    <div>
                      <div>{item.description}</div>
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                        {formatNotificationTime(item.createdAt)}
                      </Typography.Text>
                    </div>
                  }
                />
              </List.Item>
            );
            }}
          />
        )}
      </div>
    </div>
  );

  return (
    <Layout hasSider={true}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        width={300}
        breakpoint="md"
        collapsedWidth={windowWidth < 500 ? 0 : 70}
        style={{ backgroundColor: colorBgContainer }}
      >
        <Row
          style={{
            height: "72px",
            background: "linear-gradient(120deg, #08131f 0%, #10324f 100%)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            padding: collapsed ? "0 8px" : "0 16px",
          }}
          align="middle"
          justify={collapsed ? "center" : "space-between"}
        >
          <div
            style={{
              color: "#fff",
              fontWeight: 800,
              letterSpacing: 1,
              fontSize: collapsed ? 14 : 18,
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            {collapsed ? "AA" : "Alaa Ashour"}
          </div>
          {!collapsed && (
            <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>
              {t("layout.chat_room")}
            </div>
          )}
        </Row>
        <Menu
          selectedKeys={[location.pathname]}
          selectable
          defaultSelectedKeys={["1"]}
          mode="inline"
          items={menuItems}
          onClick={(e) => navigate(e.key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: "linear-gradient(120deg, #08131f 0%, #0d2237 100%)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            paddingInline: 24,
            boxShadow: "0 10px 30px rgba(8, 19, 31, 0.18)",
          }}
        >
          <Row
            style={{ height: "100%" }}
            justify="end"
            align="middle"
            gutter={[16]}
          >
            <Col>
              <DarkModeSwitch />
            </Col>
            <Col style={{ color: "white" }}>
              <LocalizationButton />
            </Col>
            <Col>
              <Popover
                trigger="click"
                content={notificationsOverlay}
                placement="bottomRight"
                open={isNotificationsOpen}
                onOpenChange={setIsNotificationsOpen}
              >
                <Button
                  type="text"
                  icon={
                    <Badge count={unreadCount} size="small" offset={[2, -2]}>
                      <BellOutlined
                        style={{
                          color: "white",
                          fontSize: "20px",
                        }}
                      />
                    </Badge>
                  }
                />
              </Popover>
            </Col>
            <Col>
              <Tooltip title={t("layout.logout")}>
                <Button
                  type="text"
                  icon={
                    <LogoutOutlined
                      style={{
                        color: "white",
                        fontSize: "20px",
                      }}
                    />
                  }
                  onClick={handleLogout}
                />
              </Tooltip>
            </Col>
          </Row>
        </Header>

        <Content
          style={{
            minHeight: "calc(100vh - 64px)",
            padding: windowWidth < 768 ? "16px" : "20px 28px 18px",
            background: "transparent",
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
