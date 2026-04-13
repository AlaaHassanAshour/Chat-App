import { useEffect, useState } from "react";
import { Card, List, Typography, Spin, Alert, Avatar, Tag } from "antd";
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
    <Card style={{ marginTop: 16 }}>
      <Title level={3} style={{ marginBottom: 20 }}>
        {t("users.title")}{" "}
        <Tag color="blue" style={{ fontSize: 12, verticalAlign: "middle" }}>
          {users.length}
        </Tag>
      </Title>
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
                padding: "12px 16px",
                borderRadius: 8,
                transition: "background 0.15s",
                background: hoveredId === user.id ? "rgba(24,144,255,0.07)" : "transparent",
              }}
              onMouseEnter={() => setHoveredId(user.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => navigate(`/chat/user/${user.id}`)}
              extra={
                hoveredId === user.id && (
                  <Tag
                    icon={<MessageOutlined />}
                    color="blue"
                    style={{ cursor: "pointer" }}
                  >
                    {t("users.message")}
                  </Tag>
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
