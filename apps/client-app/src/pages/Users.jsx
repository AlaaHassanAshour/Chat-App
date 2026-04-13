import { useEffect, useState } from "react";
import { Card, List, Typography, Spin, Alert } from "antd";
import { useNavigate } from "react-router";

import { getAllUsers } from "../services/api";

const { Title, Text } = Typography;

export default function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getAllUsers();
        setUsers(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e?.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  return (
    <Card style={{ marginTop: 16 }}>
      <Title level={3}>Users</Title>
      {loading && <Spin />}
      {!loading && error && <Alert type="error" message={error} showIcon />}
      {!loading && !error && (
        <List
          dataSource={users}
          locale={{ emptyText: "No users found" }}
          renderItem={(user) => (
            <List.Item
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/chat/user/${user.id}`)}
            >
              <Text>{user.email || user.userName || user.id}</Text>
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}
