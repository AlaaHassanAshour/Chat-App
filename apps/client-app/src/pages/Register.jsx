import { useState } from "react";
import { Button, Col, Form, Input, Row, Typography, theme } from "antd";
import { Link, useNavigate } from "react-router";

import { useThemeMode } from "../contexts/ThemeMode";
import { notification } from "../utils/InitAntStaticApi";
import { register } from "../services/api";

const { Title } = Typography;

const RegisterPage = () => {
  const { darkMode } = useThemeMode();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const handleRegister = async (formData) => {
    try {
      setLoading(true);
      await register(formData.email, formData.password, formData.mobile);
      notification.success({
        message: "Registration Successful",
        description: "Your account has been created. Please login.",
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
            Create Account
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
              label="Email"
              rules={[
                {
                  required: true,
                  message: "The Email field is required",
                },
                {
                  type: "email",
                  message: "Please enter a valid email address",
                },
              ]}
            >
              <Input placeholder="Enter your Email" disabled={loading} />
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
                  message: "The Password field must be at least 6 characters",
                },
              ]}
            >
              <Input.Password
                placeholder="Enter your Password"
                disabled={loading}
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Confirm Password"
              dependencies={["password"]}
              rules={[
                {
                  required: true,
                  message: "Please confirm your password",
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Passwords do not match"));
                  },
                }),
              ]}
            >
              <Input.Password
                placeholder="Confirm your Password"
                disabled={loading}
              />
            </Form.Item>

            <Form.Item
              name="mobile"
              label="Mobile"
              rules={[
                {
                  required: true,
                  message: "The Mobile field is required",
                },
              ]}
            >
              <Input placeholder="Enter your Mobile" disabled={loading} />
            </Form.Item>

            <Form.Item
              wrapperCol={{
                offset: 7,
                span: 24,
              }}
            >
              <Button
                style={{
                  width: "120px",
                  marginRight: "16px",
                }}
                loading={loading}
                type="primary"
                htmlType="submit"
                disabled={loading}
              >
                Register
              </Button>
              <Link to="/login">Already have an account?</Link>
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </Row>
  );
};

export default RegisterPage;
