import { useContext, useState } from "react";
import { Button, Col, Form, Input, Row, Typography, theme } from "antd";

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
  // Get theme token from antd
  const { token } = theme.useToken();

  const handleLogin = async (formData) => {
    try {
      setLoading(true);
      const response = await login(formData.email, formData.password);
      console.log("Login response:", response);
      setAuth(response.userInfo);
      localStorage.setItem(AUTH_CONFIG.tokenKey, response.token);
      notification.success({
        message: "Login Successful",
        description: "You have been successfully logged in.",
      });
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
      message: "Validation Error",
      description: "Please check the form fields and try again.",
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
          width: "600px",
          padding: "40px",
          borderRadius: "8px",
          boxShadow: darkMode
            ? `0 2px 8px ${token.colorBgElevated}57`
            : "0 2px 8px #adadad57",
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
              label="Eamil"
              rules={[
                {
                  required: true,
                  message: "The Eamil field is required",
                },
                {
                  type: "email",
                },
              ]}
            >
              <Input placeholder="Enter your Eamil" disabled={loading} />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                {
                  required: true,
                  message: "The Password field is required",
                },
                {
                  min: 6,
                  message:
                    "The Password field must be with a minimum length of 6",
                },
              ]}
            >
              <Input.Password
                placeholder="Enter your Password"
                disabled={loading}
              />
            </Form.Item>

            <Form.Item
              wrapperCol={{
                offset: 7,
                span: 24,
              }}
            >
              <Button
                style={{
                  width: "100px",
                  marginRight: "10px",
                }}
                loading={loading}
                type="primary"
                htmlType="submit"
                disabled={loading}
              >
                Login
              </Button>
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </Row>
  );
};

export default LoginPage;
