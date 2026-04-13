import { useContext, useState } from "react";
import { Button, Col, Form, Input, Row, Typography, theme } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

import { useThemeMode } from "../contexts/ThemeMode";
import Auth from "../contexts/Auth";
import { notification } from "../utils/InitAntStaticApi";
import { AUTH_CONFIG, APP_CONFIG } from "../config/env";
import { login } from "../services/api";

const { Title } = Typography;

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
      localStorage.setItem(AUTH_CONFIG.tokenKey, response.token);
      setAuth(
        response.userInfo || {
          email: formData.email,
          accessToken: response.token,
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
            style={{
              textAlign: "center",
              marginBottom: "30px",
            }}
          >
            {APP_CONFIG.name}
          </Title>
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
