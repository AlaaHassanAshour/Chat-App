import { Card, Typography, Row, Col, Space, Tag } from "antd";
import { useTranslation } from "react-i18next";
import DarkModeSwitch from "../components/DarkModeSwitch";
import LocalizationButton from "../components/LocalizationButton";
import { useThemeMode } from "../contexts/ThemeMode";

const { Title, Paragraph } = Typography;

export default function SettingsPage() {
  const { t } = useTranslation();
  const { darkMode } = useThemeMode();
  return (
    <Card
      style={{
        marginTop: 8,
        borderRadius: 24,
        boxShadow: "0 20px 50px rgba(15,30,54,0.08)",
      }}
      styles={{ body: { padding: 24 } }}
    >
      <Tag color="geekblue" style={{ marginBottom: 10, borderRadius: 999, paddingInline: 10 }}>
        Workspace
      </Tag>
      <Title level={3} style={{ marginTop: 0 }}>{t("settings.title")}</Title>
      <Paragraph type="secondary" style={{ maxWidth: 680 }}>
        Fine-tune the workspace feel and language from one place. Changes apply instantly across the app.
      </Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card bordered={false} style={{ borderRadius: 20, background: darkMode ? "rgba(255,255,255,0.04)" : "rgba(22,119,255,0.06)" }}>
            <Space direction="vertical" size={10} style={{ width: "100%" }}>
              <Tag color={darkMode ? "gold" : "blue"} style={{ width: "fit-content", borderRadius: 999 }}>
                Appearance
              </Tag>
              <Title level={4} style={{ margin: 0 }}>Theme mode</Title>
              <Paragraph type="secondary" style={{ margin: 0 }}>
                Toggle between light and dark presentation depending on your environment.
              </Paragraph>
              <DarkModeSwitch />
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card bordered={false} style={{ borderRadius: 20, background: darkMode ? "rgba(255,255,255,0.04)" : "rgba(114,46,209,0.06)" }}>
            <Space direction="vertical" size={10} style={{ width: "100%" }}>
              <Tag color="purple" style={{ width: "fit-content", borderRadius: 999 }}>
                Language
              </Tag>
              <Title level={4} style={{ margin: 0 }}>Localization</Title>
              <Paragraph type="secondary" style={{ margin: 0 }}>
                Switch the interface direction and language between Arabic and English.
              </Paragraph>
              <div style={{ width: "fit-content" }}>
                <LocalizationButton />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </Card>
  );
}
