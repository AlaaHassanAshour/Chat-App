import { Button, Form, Upload, notification } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { modal } from "../utils/InitAntStaticApi";

const ImageUpload = ({
  name,
  label,
  required,
  setImageStorageData,
  handleImageUpload,
  handlePreview,
}) => {
  return (
    <Form.Item
      name={name}
      // label={label}
      valuePropName="fileList"
      getValueFromEvent={(e) => {
        e.fileList.forEach((x) => {
          if (x.originFileObj) {
            x.url = URL.createObjectURL(x.originFileObj);
          }
        });
        return e.fileList;
      }}
      rules={[
        {
          required: required,
          message: `The ${label} field is required`,
        },
      ]}
    >
      <Upload
        accept=".png,.jpg"
        maxCount={1}
        beforeUpload={async (file) => {
          const img = new Image();
          const isValid = await new Promise((resolve) => {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = URL.createObjectURL(file);
          });

          if (!isValid) {
            notification.error({
              message: "Upload Failed",
              description: "Invalid image file",
            });
            return Upload.LIST_IGNORE;
          }

          return true;
        }}
        customRequest={({ file }) => {
          handleImageUpload(file);
        }}
        showUploadList={false}
        onPreview={handlePreview}
        onRemove={() => {
          return new Promise((resolve) => {
            modal.confirm({
              closable: true,
              title: "Delete Image",
              content: "Are you sure you want to delete the image?",
              okText: "Yes",
              cancelText: "No",
              onOk: () => {
                setImageStorageData((prev) => ({
                  ...prev,
                  [name]: null,
                }));
                resolve();
              },
              onCancel: () => resolve(false),
            });
          });
        }}
      >
        <Button type="primary">
          <UploadOutlined /> Upload Image
        </Button>
      </Upload>
    </Form.Item>
  );
};

export default ImageUpload;
