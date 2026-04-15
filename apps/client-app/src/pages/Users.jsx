import { useEffect, useState } from "react";
import { Card, List, Typography, Spin, Alert, Avatar, Tag, Space, Button } from "antd";
import { UserOutlined, MessageOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

import { getAllUsers } from "../services/api";

const { Title } = Typography;

export default function UsersPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getAllUsers();
        setUsers(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e?.message || t("users.load_error"));
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [t]);

  return (
    <Card
      style={{
        marginTop: 8,
        borderRadius: 24,
        border: "1px solid rgba(22,119,255,0.08)",
        boxShadow: "0 20px 50px rgba(15,30,54,0.08)",
      }}
      styles={{ body: { padding: 24 } }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <Tag color="blue" style={{ marginBottom: 10, borderRadius: 999, paddingInline: 10 }}>
            {users.length}
          </Tag>
          <Title level={3} style={{ margin: 0 }}>
            {t("users.title")}
          </Title>
          <Typography.Paragraph type="secondary" style={{ margin: "8px 0 0" }}>
            Start a direct conversation with any member from the directory.
          </Typography.Paragraph>
        </div>
      </div>
      {loading && (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
        </div>
      )}
      {!loading && error && <Alert type="error" message={error} showIcon />}
      {!loading && !error && (
        <List
          dataSource={users}
          locale={{ emptyText: t("users.not_found") }}
          itemLayout="horizontal"
          renderItem={(user) => (
            <List.Item
              style={{
                cursor: "pointer",
                padding: "14px 18px",
                borderRadius: 18,
                transition: "transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease",
                background: hoveredId === user.id ? "rgba(24,144,255,0.08)" : "rgba(255,255,255,0.56)",
                boxShadow: hoveredId === user.id ? "0 12px 30px rgba(22,119,255,0.10)" : "none",
                transform: hoveredId === user.id ? "translateY(-1px)" : "none",
                marginBottom: 10,
              }}
              onMouseEnter={() => setHoveredId(user.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => navigate(`/chat/user/${user.id}`)}
              extra={
                hoveredId === user.id && (
                  <Button type="link" icon={<MessageOutlined />} style={{ paddingInline: 0 }}>
                    {t("users.message")}
                  </Button>
                )
              }
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={<UserOutlined />}
                    style={{ background: "#1677ff" }}
                  />
                }
                title={user.email || user.userName || user.id}
                description={user.mobile || user.phoneNumber || ""}
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}
