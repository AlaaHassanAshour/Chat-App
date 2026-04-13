import { Card, Typography } from "antd";

const { Title, Paragraph } = Typography;

export default function SettingsPage() {
  return (
    <Card style={{ marginTop: 16 }}>
      <Title level={3}>Settings</Title>
      <Paragraph>Settings page is ready.</Paragraph>
    </Card>
  );
}
