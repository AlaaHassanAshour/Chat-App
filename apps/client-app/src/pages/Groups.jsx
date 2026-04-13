import { useEffect, useState } from "react";
import { Card, List, Typography, Spin, Alert } from "antd";

import { getGroups } from "../services/api";

const { Title, Text } = Typography;

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadGroups = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getGroups();
        setGroups(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e?.message || "Failed to load groups");
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, []);

  return (
    <Card style={{ marginTop: 16 }}>
      <Title level={3}>Groups</Title>
      {loading && <Spin />}
      {!loading && error && <Alert type="error" message={error} showIcon />}
      {!loading && !error && (
        <List
          dataSource={groups}
          locale={{ emptyText: "No groups found" }}
          renderItem={(group) => (
            <List.Item>
              <Text>{group.name || group.title || group.id}</Text>
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}
