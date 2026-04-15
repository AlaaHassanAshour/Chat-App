import { useState } from "react";
import { Button, Col, Form, Input, Row, Typography, theme } from "antd";
import { MailOutlined, LockOutlined, PhoneOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

import { useThemeMode } from "../contexts/ThemeMode";
import { notification } from "../utils/InitAntStaticApi";
import { register } from "../services/api";

const { Title, Paragraph, Text } = Typography;

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
        minHeight: "calc(100vh - 64px)",
        padding: "24px",
        background:
          "radial-gradient(circle at top left, rgba(114,46,209,0.14), transparent 30%), radial-gradient(circle at bottom right, rgba(22,119,255,0.16), transparent 28%)",
      }}
      align="middle"
      justify="center"
    >
      <Row
        style={{
          width: "100%",
          maxWidth: "560px",
          padding: "42px 40px 34px",
          borderRadius: "28px",
          boxShadow: darkMode
            ? `0 20px 50px rgba(0,0,0,0.38)`
            : "0 24px 60px rgba(15, 30, 54, 0.14)",
          background: token.colorBgElevated,
          border: `1px solid ${token.colorBorderSecondary}`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            insetInlineEnd: -40,
            top: -56,
            width: 150,
            height: 150,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(114,46,209,0.18), transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <Col span={24}>
          <Text
            style={{
              display: "inline-block",
              marginBottom: 10,
              padding: "4px 10px",
              borderRadius: 999,
              background: token.colorInfoBg,
              color: token.colorInfo,
              fontWeight: 700,
              letterSpacing: 0.3,
            }}
          >
            {t("auth.register")}
          </Text>
          <Title
            level={2}
            style={{ marginBottom: 8 }}
          >
            {t("auth.register_title")}
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 28, fontSize: 15 }}>
            {t("auth.register_success_desc")}
          </Paragraph>
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
