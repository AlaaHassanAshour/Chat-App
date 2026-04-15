import { useContext, useState } from "react";
import { Button, Col, Form, Input, Row, Typography, theme } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

import { useThemeMode } from "../contexts/ThemeMode";
import Auth from "../contexts/Auth";
import { notification } from "../utils/InitAntStaticApi";
import { APP_CONFIG } from "../config/env";
import { login } from "../services/api";
import { normalizeAuthResponse, setAuthSession } from "../utils/authSession";

const { Title, Paragraph, Text } = Typography;

/**
 * Login page component that handles user authentication
 * Supports username login
 */
const LoginPage = () => {
  const { setAuth } = useContext(Auth);
  const { darkMode } = useThemeMode();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { token } = theme.useToken();

  const handleLogin = async (formData) => {
    try {
      setLoading(true);
      const response = await login(formData.email, formData.password);
      console.log("Login response:", response);
      const session = normalizeAuthResponse(response);
      setAuthSession(session);
      setAuth(
        response.userInfo || {
          email: formData.email,
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
        }
      );
      notification.success({
        message: t("auth.login_success"),
        description: t("auth.login_success_desc"),
      });
      navigate("/chat", { replace: true });
    } catch {
      // Clear password field on error
      form.setFields([
        {
          name: "password",
          value: "",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginFailed = () => {
    notification.error({
      message: t("common.validation_error"),
      description: t("common.form_error"),
    });
  };

  return (
    <Row
      style={{
        height: "100%",
        minHeight: "calc(100vh - 64px)",
        padding: "24px",
        background:
          "radial-gradient(circle at top left, rgba(22,119,255,0.16), transparent 30%), radial-gradient(circle at bottom right, rgba(114,46,209,0.16), transparent 28%)",
      }}
      align="middle"
      justify="center"
    >
      <Row
        style={{
          width: "100%",
          maxWidth: "520px",
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
            insetInlineStart: -40,
            top: -56,
            width: 150,
            height: 150,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(22,119,255,0.22), transparent 70%)",
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
              background: token.colorPrimaryBg,
              color: token.colorPrimary,
              fontWeight: 700,
              letterSpacing: 0.3,
            }}
          >
            {APP_CONFIG.name}
          </Text>
          <Title
            level={2}
            style={{
              marginBottom: 8,
            }}
          >
            {t("auth.login")}
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 28, fontSize: 15 }}>
            {t("auth.login_success_desc")}
          </Paragraph>
        </Col>
        <Col span={24}>
          <Form
            form={form}
            name="loginForm"
            labelCol={{ span: 7 }}
            wrapperCol={{ span: 17 }}
            onFinish={handleLogin}
            onFinishFailed={handleLoginFailed}
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

            <Form.Item wrapperCol={{ offset: 7, span: 17 }}>
              <Button
                block
                loading={loading}
                type="primary"
                htmlType="submit"
                disabled={loading}
                style={{ marginBottom: 12 }}
              >
                {t("auth.login")}
              </Button>
              <div style={{ textAlign: "center" }}>
                <Link to="/register">{t("auth.no_account")}</Link>
              </div>
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </Row>
  );
};

export default LoginPage;
