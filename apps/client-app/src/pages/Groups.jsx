import { useEffect, useState } from "react";
import {
  Card,
  List,
  Typography,
  Spin,
  Alert,
  Button,
  Modal,
  Input,
  Checkbox,
  Space,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router";

import { createGroub, getAllUsers, getGroups } from "../services/api";

const { Title, Text } = Typography;

export default function GroupsPage() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [creating, setCreating] = useState(false);

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

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await getAllUsers();
        setUsers(Array.isArray(data) ? data : []);
      } catch {
        setUsers([]);
      }
    };

    loadUsers();
  }, []);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      messageApi.warning("Group name is required");
      return;
    }

    if (selectedMemberIds.length === 0) {
      messageApi.warning("Select at least one member");
      return;
    }

    try {
      setCreating(true);
      const newGroup = await createGroub(newGroupName.trim(), selectedMemberIds);
      setGroups((prev) => [...prev, newGroup]);
      setOpenCreateModal(false);
      setNewGroupName("");
      setSelectedMemberIds([]);
      messageApi.success("Group created successfully");
    } catch (e) {
      messageApi.error(e?.message || "Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card style={{ marginTop: 16 }}>
      {contextHolder}
      <Space
        style={{ width: "100%", justifyContent: "space-between", marginBottom: 12 }}
      >
        <Title level={3} style={{ margin: 0 }}>
          Groups
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setOpenCreateModal(true)}
        >
          Create Group
        </Button>
      </Space>
      {loading && <Spin />}
      {!loading && error && <Alert type="error" message={error} showIcon />}
      {!loading && !error && (
        <List
          dataSource={groups}
          locale={{ emptyText: "No groups found" }}
          renderItem={(group) => (
            <List.Item
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/chat/group/${group.id}`)}
            >
              <Text>{group.name || group.title || group.id}</Text>
            </List.Item>
          )}
        />
      )}

      <Modal
        title="Create Group"
        open={openCreateModal}
        okText="Create"
        onCancel={() => setOpenCreateModal(false)}
        onOk={handleCreateGroup}
        confirmLoading={creating}
      >
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          <Input
            placeholder="Group name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <div>Select members:</div>
          <Checkbox.Group
            style={{
              display: "flex",
              flexDirection: "column",
              maxHeight: 200,
              overflowY: "auto",
            }}
            value={selectedMemberIds}
            onChange={setSelectedMemberIds}
          >
            {users.map((user) => (
              <Checkbox key={user.id} value={user.id}>
                {user.email || user.userName || user.id}
              </Checkbox>
            ))}
          </Checkbox.Group>
        </Space>
      </Modal>
    </Card>
  );
}
