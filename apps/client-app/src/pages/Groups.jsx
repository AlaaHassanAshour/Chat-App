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
  Avatar,
  Tag,
} from "antd";
import { PlusOutlined, TeamOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

import { createGroub, getAllUsers, getGroups } from "../services/api";

const { Title } = Typography;

export default function GroupsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
        setError(e?.message || t("groups.load_error"));
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
      messageApi.warning(t("groups.name_required"));
      return;
    }

    if (selectedMemberIds.length === 0) {
      messageApi.warning(t("groups.member_required"));
      return;
    }

    try {
      setCreating(true);
      const newGroup = await createGroub(newGroupName.trim(), selectedMemberIds);
      setGroups((prev) => [...prev, newGroup]);
      setOpenCreateModal(false);
      setNewGroupName("");
      setSelectedMemberIds([]);
      messageApi.success(t("groups.create_success"));
    } catch (e) {
      messageApi.error(e?.message || t("groups.create_error"));
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
          {t("groups.title")}
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setOpenCreateModal(true)}
        >
          {t("groups.create_group")}
        </Button>
      </Space>
      {loading && <Spin />}
      {!loading && error && <Alert type="error" message={error} showIcon />}
      {!loading && !error && (
        <List
          dataSource={groups}
          locale={{ emptyText: t("groups.not_found") }}
          itemLayout="horizontal"
          renderItem={(group) => (
            <List.Item
              style={{
                cursor: "pointer",
                padding: "12px 16px",
                borderRadius: 8,
                transition: "background 0.15s",
              }}
              className="group-list-item"
              onClick={() => navigate(`/chat/group/${group.id}`)}
              extra={
                <Tag
                  icon={<TeamOutlined />}
                  color="purple"
                  style={{ cursor: "pointer" }}
                >
                  {t("groups.open")}
                </Tag>
              }
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={<TeamOutlined />}
                    style={{ background: "#722ed1" }}
                  />
                }
                title={group.name || group.title || group.id}
                description={`${group.memberCount ?? ""} ${t("groups.members")}`.trim()}
              />
            </List.Item>
          )}
        />
      )}

      <Modal
        title={t("chat.create_group_title")}
        open={openCreateModal}
        okText={t("common.create")}
        cancelText={t("common.cancel")}
        onCancel={() => setOpenCreateModal(false)}
        onOk={handleCreateGroup}
        confirmLoading={creating}
      >
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          <Input
            placeholder={t("chat.group_name_placeholder")}
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <div>{t("chat.select_members")}</div>
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
