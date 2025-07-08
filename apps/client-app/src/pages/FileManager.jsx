import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Input,
  Row,
  Col,
  message,
  Breadcrumb,
  Tooltip,
  Popconfirm,
  Typography,
  Image,
  Space,
} from "antd";
import {
  FolderOutlined,
  PlusOutlined,
  EditFilled,
  DeleteFilled,
  ArrowLeftOutlined,
  CopyOutlined,
  EyeOutlined,
} from "@ant-design/icons";

import ImageUpload from "../components/ImageUpload";
import {
  createFolder,
  getFolderContents,
  renameFolder,
  renameFile,
  deleteFolder,
  uploadImage,
  deleteImage,
} from "../services/api";

export default function FileManager() {
  const [allFolders, setAllFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchFolders = async () => {
    try {
      setLoading(true);
      const path = "/" + currentPath.join("/");
      const response = await getFolderContents(path);
      const formatted = response
        .filter((item) => {
          // Keep folders
          if (item.isDirectory) return true;
          // Keep only image files
          const imageExtensions = [
            ".jpg",
            ".jpeg",
            ".png",
            ".gif",
            ".bmp",
            ".webp",
          ];
          const extension = item.name
            .toLowerCase()
            .slice(item.name.lastIndexOf("."));
          return imageExtensions.includes(extension);
        })
        .map((item) => ({
          key: item.name,
          name: item.name,
          isDirectory: item.isDirectory,
          size: item.length,
          lastModified: item.lastModified,
          physicalPath: item.physicalPath,
        }));
      setAllFolders(formatted);
    } catch (err) {
      if (err.response?.status === 404) {
        message.error("Directory not found");
      } else if (err.response?.status === 400) {
        message.error(err.response.data?.message || "Invalid path");
      } else {
        message.error("Failed to fetch folders");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, [currentPath]);

  const navigateTo = (folderName) => {
    setCurrentPath([...currentPath, folderName]);
  };

  const navigateBack = () => {
    setCurrentPath(currentPath.slice(0, -1));
  };

  const handleCreateFolder = async () => {
    setIsEditMode(false);
    if (!newFolderName) {
      message.warning("Please enter a folder name");
      return;
    }
    const pathString = "/" + currentPath.join("/");
    try {
      await createFolder(newFolderName, pathString);
      message.success("Folder created successfully");
      setNewFolderName("");
      setIsModalOpen(false);
      fetchFolders();
    } catch (err) {
      if (err.response?.status === 409) {
        message.error("A folder with this name already exists");
      } else if (err.response?.status === 400) {
        message.error(
          err.response.data?.message || "Invalid folder name or path"
        );
      } else {
        message.error("Failed to create folder");
      }
    }
  };

  const handleRename = async () => {
    if (!newFolderName || !selectedItem) {
      message.warning("Please enter a name");
      return;
    }
    if (newFolderName === selectedItem.name) {
      message.warning("No changes made, same name provided");
      setIsModalOpen(false);
      setIsEditMode(false);
      setNewFolderName("");
      setSelectedItem(null);
      return;
    }
    try {
      const pathString = "/" + [...currentPath, selectedItem.name].join("/");
      if (selectedItem.isDirectory) {
        await renameFolder(newFolderName, pathString);
      } else {
        // For files, we need to handle the extension
        const extension = selectedItem.name.slice(
          selectedItem.name.lastIndexOf(".")
        );
        const newName = newFolderName.endsWith(extension)
          ? newFolderName
          : newFolderName + extension;
        await renameFile(newName, pathString);
      }
      message.success("Renamed successfully");
      setIsModalOpen(false);
      setIsEditMode(false);
      setNewFolderName("");
      fetchFolders();
    } catch (err) {
      if (err.response?.status === 409) {
        message.error("A file/folder with this name already exists");
      } else if (err.response?.status === 404) {
        message.error("Original file/folder not found");
      } else if (err.response?.status === 400) {
        message.error(err.response.data?.message || "Invalid name");
      } else {
        message.error("Failed to rename");
      }
      onCancel();
    }
  };

  const onCancel = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setNewFolderName("");
    setSelectedItem(null);
  };

  const handleDeleteFolder = async (name) => {
    try {
      const fullPath = "/" + [...currentPath, name].join("/");
      await deleteFolder(fullPath);
      message.success("Deleted successfully");
      setIsModalOpen(false);
      fetchFolders();
    } catch (err) {
      if (err.response?.status === 404) {
        message.error("Folder not found");
      } else if (err.response?.status === 400) {
        message.error(err.response.data?.message || "Invalid path");
      } else {
        message.error("Failed to delete folder");
      }
    }
  };

  const onEditClick = (record) => {
    setIsEditMode(true);
    setIsModalOpen(true);
    // For files, remove the extension when showing in the input
    const displayName = record.isDirectory
      ? record.name
      : record.name.slice(0, record.name.lastIndexOf("."));
    setNewFolderName(displayName);
    setSelectedItem(record);
  };

  const handleImageUpload = async (file) => {
    const formData = new FormData();

    const uploadPath = currentPath.join("/") || "/";
    const customFileName = file.name.split(".")[0];

    formData.append("file", file);
    formData.append("path", uploadPath);
    formData.append("customFileName", customFileName);

    try {
      await uploadImage(formData);
      message.success("Image uploaded successfully");
      fetchFolders(currentPath);
    } catch (error) {
      message.error("Upload Error:", error);
    }
  };

  const buildImageUrl = (filePath) => {
    if (!filePath) return "";
    const basePath = filePath.split("/Campaigns/")[1];
    if (!basePath) return "";
    const encodedPath = encodeURIComponent(basePath);
    return `https://system2.mifteam.com:44321/api/Upload/GetImage?imagePath=${encodedPath}`;
  };

  const handleCopyLink = (imagePath) => {
    console.log(imagePath);
    const imageUrl = buildImageUrl(imagePath);
    navigator.clipboard.writeText(imageUrl).then(
      () => {
        message.success("Image link copied to clipboard");
      },
      () => {
        message.error("Failed to copy image link");
      }
    );
  };

  const handleDeleteImage = async (imagePath) => {
    try {
      const basePath = imagePath.split("/Campaigns/")[1];
      await deleteImage(basePath);
      message.success("Image deleted successfully");
      fetchFolders();
    } catch (err) {
      if (err.response?.status === 404) {
        message.error("Image not found");
      } else if (err.response?.status === 400) {
        message.error(err.response.data?.message || "Failed to delete image");
      } else {
        message.error("Failed to delete image");
      }
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) =>
        record.isDirectory ? (
          <span
            onClick={() => navigateTo(record.name)}
            style={{ cursor: "pointer" }}
          >
            <FolderOutlined style={{ marginRight: 8 }} />
            {text}
          </span>
        ) : (
          <span>
            <Image
              src={buildImageUrl(record.physicalPath)}
              style={{
                width: 20,
                height: 20,
                margin: 8,
                objectFit: "contain",
              }}
              preview={{
                src: buildImageUrl(record.physicalPath),
                mask: <EyeOutlined />,
                maskClassName: "custom-image-mask",
              }}
            />
            {text}
          </span>
        ),
    },
    {
      title: "LastModified",
      dataIndex: "lastModified",
      key: "lastModified",
      render: (_) =>
        new Date(_).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          {!record.isDirectory && (
            <>
              <Tooltip title="Rename Image">
                <Button
                  icon={<EditFilled />}
                  onClick={() => onEditClick(record)}
                />
              </Tooltip>
              <Tooltip title="Delete Image">
                <Popconfirm
                  title="Delete Image"
                  description="Are you sure you want to delete this image?"
                  onConfirm={() => handleDeleteImage(record.physicalPath)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button danger icon={<DeleteFilled />} />
                </Popconfirm>
              </Tooltip>
              <Tooltip title="Copy Image Link">
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => handleCopyLink(record.physicalPath)}
                />
              </Tooltip>
            </>
          )}
          {record.isDirectory && (
            <>
              <Tooltip title="Rename Folder">
                <Button
                  icon={<EditFilled />}
                  onClick={() => onEditClick(record)}
                />
              </Tooltip>
              <Tooltip title="Delete Folder">
                <Popconfirm
                  title="Delete Folder"
                  description="Are you sure you want to delete this folder?"
                  onConfirm={() => handleDeleteFolder(record.name)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button danger icon={<DeleteFilled />} />
                </Popconfirm>
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Typography.Title level={2}>File Manager</Typography.Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col>
          {currentPath.length > 0 && (
            <Button icon={<ArrowLeftOutlined />} onClick={navigateBack}>
              Back
            </Button>
          )}
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
          >
            new folder
          </Button>
        </Col>
        <Col>
          <ImageUpload
            name="image"
            label="upload image"
            form={null}
            imageStorageData={{}}
            setImageStorageData={() => {}}
            handleImageUpload={handleImageUpload}
            handlePreview={() => {}}
          />
        </Col>
      </Row>
      {currentPath.length > 0 && (
        <Breadcrumb style={{ marginBottom: 16 }}>
          <Breadcrumb.Item>path :</Breadcrumb.Item>
          {currentPath.map((p, i) => (
            <Breadcrumb.Item key={i}>{p}</Breadcrumb.Item>
          ))}
        </Breadcrumb>
      )}

      <Table
        columns={columns}
        loading={loading}
        dataSource={allFolders}
        pagination={false}
        rowKey="name"
      />

      <Modal
        title={
          isEditMode
            ? `Rename ${selectedItem?.isDirectory ? "folder" : "file"}`
            : "create new folder"
        }
        open={isModalOpen}
        onCancel={() => onCancel()}
        onOk={isEditMode ? handleRename : handleCreateFolder}
        okText={isEditMode ? "rename" : "create"}
        cancelText="cancel"
      >
        <Input
          placeholder="name"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
        />
      </Modal>
    </>
  );
}
