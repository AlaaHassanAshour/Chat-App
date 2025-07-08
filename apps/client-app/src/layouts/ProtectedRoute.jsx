import { useState, useMemo, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { Col, Layout, Menu, Row, Button, Tooltip, theme } from "antd";
import { FolderOpenFilled, LogoutOutlined,MessageFilled  ,UsergroupAddOutlined,TeamOutlined,SettingOutlined} from "@ant-design/icons";

import DarkModeSwitch from "../components/DarkModeSwitch";
import LocalizationButton from "../components/LocalizationButton";
import { useAuth } from "../contexts/Auth";
import { AUTH_CONFIG } from "../config/env";

const { Header, Content, Sider } = Layout;

function getItem(label, key, icon, children, type) {
  return {
    label,
    key,
    icon,
    children,
    type,
  };
}

export default function ProtectedRoute() {
  const { setAuth } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const handleLogout = () => {
    localStorage.removeItem(AUTH_CONFIG.tokenKey);
    setAuth(false);
    navigate("/login");
  };

  const menuItems = useMemo(
    () => [getItem("File Manager", "/file-manager", <FolderOpenFilled />),
          getItem("Chat Room", "/chat", <MessageFilled />),
          getItem("Users", "/users", <UsergroupAddOutlined />),
          getItem("Groups", "/groups", <TeamOutlined />),
          getItem("Settings", "/settings", <SettingOutlined />),
    ],
    []
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth < 1200) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <Layout hasSider={true}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        width={300}
        breakpoint="md"
        collapsedWidth={windowWidth < 500 ? 0 : 70}
        style={{ backgroundColor: colorBgContainer }}
      >
        <Row
          style={{ height: "64px", backgroundColor: "#001529" }}
          align="middle"
          justify="center"
        >
          <img
            style={collapsed ? { width: "45px" } : {}}
            src="https://tentime.com/assets/images/Logo%20(1).svg"
          />
        </Row>
        <Menu
          selectedKeys={[location.pathname]}
          selectable
          defaultSelectedKeys={["1"]}
          mode="inline"
          items={menuItems}
          onClick={(e) => navigate(e.key)}
        />
      </Sider>
      <Layout>
        <Header>
          <Row
            style={{ height: "100%" }}
            justify="end"
            align="middle"
            gutter={[16]}
          >
            <Col>
              <DarkModeSwitch />
            </Col>
            <Col>
              <LocalizationButton />
            </Col>
            <Col>
              <Tooltip title="Logout">
                <Button
                  type="text"
                  icon={
                    <LogoutOutlined
                      style={{
                        color: "white",
                        fontSize: "20px",
                      }}
                    />
                  }
                  onClick={handleLogout}
                />
              </Tooltip>
            </Col>
          </Row>
        </Header>

        <Content
          style={{
            minHeight: "calc(100vh - 64px)",
            padding: "0px 50px 10px",
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
