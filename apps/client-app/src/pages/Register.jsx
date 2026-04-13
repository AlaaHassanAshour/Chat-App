import { useState } from "react";
import { Button, Col, Form, Input, Row, Typography, theme } from "antd";
import { MailOutlined, LockOutlined, PhoneOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

import { useThemeMode } from "../contexts/ThemeMode";
import { notification } from "../utils/InitAntStaticApi";
import { register } from "../services/api";

const { Title } = Typography;

const RegisterPage = () => {
  const { darkMode } = useThemeMode();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { token } = theme.useToken();

  const handleRegister = async (formData) => {
    try {
      setLoading(true);
      await register(formData.email, formData.password, formData.mobile);
      notification.success({
        message: t("auth.register_success"),
        description: t("auth.register_success_desc"),
      });
      navigate("/login");
    } catch {
      form.setFields([
        { name: "password", value: "" },
        { name: "confirmPassword", value: "" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterFailed = () => {
    notification.error({
      message: t("common.validation_error"),
      description: t("common.form_error"),
    });
  };

  return (
    <Row
      style={{
        height: "100%",
        padding: "20px",
      }}
      align="middle"
      justify="center"
    >
      <Row
        style={{
          width: "100%",
          maxWidth: "480px",
          padding: "40px",
          borderRadius: "12px",
          boxShadow: darkMode
            ? `0 4px 24px rgba(0,0,0,0.4)`
            : "0 4px 24px rgba(0,0,0,0.10)",
          background: token.colorBgElevated,
        }}
      >
        <Col span={24}>
          <Title
            level={2}
            style={{ textAlign: "center", marginBottom: "30px" }}
          >
            {t("auth.register_title")}
          </Title>
        </Col>
        <Col span={24}>
          <Form
            form={form}
            name="registerForm"
            labelCol={{ span: 7 }}
            wrapperCol={{ span: 17 }}
            onFinish={handleRegister}
            onFinishFailed={handleRegisterFailed}
            autoComplete="off"
          >
            <Form.Item
              name="email"
              label={t("auth.email")}
              rules={[
                { required: true, message: t("auth.email_required") },
                { type: "email", message: t("auth.email_invalid") },
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ opacity: 0.4 }} />}
                placeholder={t("auth.email_placeholder")}
                disabled={loading}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={t("auth.password")}
              rules={[
                { required: true, message: t("auth.password_required") },
                { min: 6, message: t("auth.password_min") },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ opacity: 0.4 }} />}
                placeholder={t("auth.password_placeholder")}
                disabled={loading}
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label={t("auth.confirm_password")}
              dependencies={["password"]}
              rules={[
                { required: true, message: t("auth.confirm_password_required") },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error(t("auth.confirm_password_mismatch")));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ opacity: 0.4 }} />}
                placeholder={t("auth.confirm_password_placeholder")}
                disabled={loading}
              />
            </Form.Item>

            <Form.Item
              name="mobile"
              label={t("auth.mobile")}
              rules={[
                { required: true, message: t("auth.mobile_required") },
              ]}
            >
              <Input
                prefix={<PhoneOutlined style={{ opacity: 0.4 }} />}
                placeholder={t("auth.mobile_placeholder")}
                disabled={loading}
              />
            </Form.Item>

            <Form.Item wrapperCol={{ offset: 7, span: 17 }}>
              <Button
                block
                loading={loading}
                type="primary"
                htmlType="submit"
                disabled={loading}
                style={{ marginBottom: 12 }}
              >
                {t("auth.register")}
              </Button>
              <div style={{ textAlign: "center" }}>
                <Link to="/login">{t("auth.have_account")}</Link>
              </div>
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </Row>
  );
};

export default RegisterPage;
