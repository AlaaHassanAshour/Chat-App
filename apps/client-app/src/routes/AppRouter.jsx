import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import { Col, Layout, Row, Spin } from "antd";

// unprotcted pages
import LoginPage from "../pages/Login";
import FileManagerPage from "../pages/FileManager";
import ChatRoom from "../components/ChatRoom";

import UnprotectedRouteLayout from "../layouts/UnprotectedRoute";
import ProtectedRoute from "../layouts/ProtectedRoute";
import { apiCommon } from "../utils/axiosInstance";
import Auth from "../contexts/Auth";

const { Content } = Layout;

const AppRouter = () => {
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    async function isAuth() {
      try {
        const Authorization = localStorage.getItem("accessToken");
        if (Authorization) {
          const userData = {
            accessToken: Authorization,
            username : "Admin", // Placeholder for username, replace with actual logic if needed
          }
          // const userData = await apiCommon.get("/User/user-info");

          setAuth(userData);
        } else {
          setAuth(false);
        }
      } catch {
        localStorage.removeItem("accessToken");
        setAuth(false);
      }
    }
    isAuth();
  }, []);

  if (auth === null) {
    return (
      <Layout>
        <Content>
          <Row style={{ height: "100vh" }} align="middle" justify="center">
            <Col>
              <Spin size="large"></Spin>
            </Col>
          </Row>
        </Content>
      </Layout>
    );
  }

  return (
    <Auth.Provider value={{ auth, setAuth }}>
      <Router>
        <Routes>
          {auth === false && (
            <>
              <Route
                path="/login"
                element={
                  <UnprotectedRouteLayout>
                    <LoginPage />
                  </UnprotectedRouteLayout>
                }
              />
              <Route path="*" element={<Navigate to="/login" />} />
            </>
          )}

          {auth && (
            <>
              <Route path="/" element={<Navigate to="/file-manager" />} />
                    
              <Route path="/" element={<ProtectedRoute />}>
                <Route path="/file-manager" element={<FileManagerPage />} />
                 <Route path="/chat" element={<ChatRoom />} />         
                <Route path="*" element={<Navigate to="/file-manager" />} />
              </Route>
            </>
          )}
        </Routes>
      </Router>
    </Auth.Provider>
  );
};

export default AppRouter;
