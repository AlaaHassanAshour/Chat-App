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

import { createGroub, getAllUsers, getGroupsUser, deleteGroup, leaveGroup } from "../services/api";
import { AUTH_CONFIG } from "../config/env";
import { jwtDecode } from "jwt-decode";

const { Title } = Typography;

export default function GroupsPage() {
  // جلب userId الحالي من التوكن
  const token = localStorage.getItem(AUTH_CONFIG.tokenKey || "accessToken");
  let currentUserId = null;
  if (token) {
    try {
      const decoded = jwtDecode(token);
      currentUserId = decoded.userId || decoded.nameid || decoded.sub;
    } catch { /* empty */ }
  }
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
        const data = await getGroupsUser();
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

    // أضف userId المنشئ تلقائياً إذا لم يكن موجوداً
    let members = [...selectedMemberIds];
    if (currentUserId && !members.includes(currentUserId)) {
      members = [currentUserId, ...members];
    }

    if (members.length === 0) {
      messageApi.warning(t("groups.member_required"));
      return;
    }

    try {
      setCreating(true);
      const newGroup = await createGroub(newGroupName.trim(), members);
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
    <Card
      style={{
        marginTop: 8,
        borderRadius: 24,
        border: "1px solid rgba(114,46,209,0.10)",
        boxShadow: "0 20px 50px rgba(15,30,54,0.08)",
      }}
      styles={{ body: { padding: 24 } }}
    >
      {contextHolder}
      <Space
        style={{ width: "100%", justifyContent: "space-between", marginBottom: 12 }}
      >
        <div>
          <Tag color="purple" style={{ marginBottom: 10, borderRadius: 999, paddingInline: 10 }}>
            {groups.length}
          </Tag>
          <Title level={3} style={{ margin: 0 }}>
            {t("groups.title")}
          </Title>
          <Typography.Paragraph type="secondary" style={{ margin: "8px 0 0" }}>
            Organize people into rooms for faster collaboration and discussion.
          </Typography.Paragraph>
        </div>
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
          renderItem={(group) => {
            const isOwner = currentUserId && (group.ownerId === currentUserId || group.OwnerId === currentUserId);
            return (
              <List.Item
                style={{
                  cursor: "pointer",
                  padding: "14px 18px",
                  borderRadius: 18,
                  transition: "transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease",
                  background: "rgba(255,255,255,0.56)",
                  boxShadow: "0 8px 24px rgba(114,46,209,0.06)",
                  marginBottom: 10,
                }}
                className="group-list-item"
                onClick={() => navigate(`/chat/group/${group.id}`)}
                extra={
                  <Space>
                    <Tag
                      icon={<TeamOutlined />}
                      color="purple"
                      style={{ cursor: "pointer" }}
                    >
                      {t("groups.open")}
                    </Tag>
                    <Button
                      danger={isOwner}
                      size="small"
                      onClick={async e => {
                        e.stopPropagation();
                        if (isOwner) {
                          Modal.confirm({
                            title: t("groups.delete_confirm_title"),
                            content: t("groups.delete_confirm_msg"),
                            okText: t("groups.delete"),
                            cancelText: t("common.cancel"),
                            okButtonProps: { danger: true },
                            onOk: async () => {
                              try {
                                await deleteGroup(group.id);
                                setGroups(prev => prev.filter(g => g.id !== group.id));
                                messageApi.success(t("groups.delete_success"));
                              } catch (err) {
                                messageApi.error(err?.message || t("groups.delete_error"));
                              }
                            },
                          });
                        } else {
                          Modal.confirm({
                            title: t("groups.leave_confirm_title"),
                            content: t("groups.leave_confirm_msg"),
                            okText: t("groups.leave"),
                            cancelText: t("common.cancel"),
                            onOk: async () => {
                              try {
                                await leaveGroup(group.id);
                                setGroups(prev => prev.filter(g => g.id !== group.id));
                                messageApi.success(t("groups.leave_success"));
                              } catch (err) {
                                messageApi.error(err?.message || t("groups.leave_error"));
                              }
                            },
                          });
                        }
                      }}
                    >
                      {isOwner ? t("groups.delete") : t("groups.leave")}
                    </Button>
                  </Space>
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
            );
          }}
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
