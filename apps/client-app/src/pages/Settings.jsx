import { Card, Typography } from "antd";
import { useTranslation } from "react-i18next";

const { Title, Paragraph } = Typography;

export default function SettingsPage() {
  const { t } = useTranslation();
  return (
    <Card style={{ marginTop: 16 }}>
      <Title level={3}>{t("settings.title")}</Title>
      <Paragraph>{t("settings.description")}</Paragraph>
    </Card>
  );
}
