import { useState, useMemo, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { Col, Layout, Menu, Row, Button, Tooltip, theme, Badge, Popover, List, Typography, Space } from "antd";
import { LogoutOutlined, MessageFilled, UsergroupAddOutlined, TeamOutlined, SettingOutlined, BellOutlined, CheckOutlined, DeleteOutlined, UserOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import DarkModeSwitch from "../components/DarkModeSwitch";
import LocalizationButton from "../components/LocalizationButton";
import { useAuth } from "../contexts/Auth";
import { useNotifications } from "../contexts/Notifications";
import { AUTH_CONFIG } from "../config/env";

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
  const { t } = useTranslation();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useNotifications();

  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const handleLogout = () => {
    localStorage.removeItem(AUTH_CONFIG.tokenKey);
    setAuth(false);
    navigate("/login");
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

  const {
    token: { colorBgContainer },
  } = theme.useToken();

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
        <List
          dataSource={notifications}
          locale={{ emptyText: t("notifications.empty") }}
          renderItem={(item) => (
            <List.Item
              style={{
                padding: "10px 12px",
                cursor: "pointer",
                background: item.isRead ? "transparent" : "rgba(22,119,255,0.08)",
              }}
              onClick={() => markAsRead(item.id)}
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
                description={item.description}
              />
            </List.Item>
          )}
        />
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
        <Header>
          <Row
            style={{ height: "100%" }}
            justify="end"
            align="middle"
            gutter={[16]}
          >
            <Col>
              <DarkModeSwitch />
            </Col>
            <Col>
              <LocalizationButton />
            </Col>
            <Col>
              <Popover
                trigger="click"
                content={notificationsOverlay}
                placement="bottomRight"
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
            padding: "0px 50px 10px",
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
