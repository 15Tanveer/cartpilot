import React, { Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { App as AntdApp, ConfigProvider, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import MainLayout from "./layouts/MainLayout";
import { appRoutes } from "./config/routes";
import Login from "./pages/login/Login";
import { getLightAntdTheme } from "./config/antdTheme";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import { ROUTES } from "./constants";
import "./App.scss";

import NotFound from "./components/common/NotFoundComponent/NotFound";

// Fallback loader component
const FallbackLoader = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      backgroundColor: "#f5f5f5",
    }}
  >
    <Spin
      indicator={<LoadingOutlined style={{ fontSize: 48, color: "#667eea" }} />}
      size="large"
    />
  </div>
);

function App() {
  const antdTheme = getLightAntdTheme();

  return (
    <ConfigProvider theme={antdTheme}>
      <AntdApp message={{ top: 80, maxCount: 3 }}>
        <ProtectedRoute>
          <Router>
            <Suspense fallback={<FallbackLoader />}>
              <Routes>
                {/* Public Login Route - No MainLayout */}
                <Route path={ROUTES.LOGIN} element={<Login />} />
                {/* navigate to abandoned carts on first load */}
                <Route
                  path="/"
                  element={<Navigate to={ROUTES.CARTS} replace />}
                />

                {/* Protected Routes with MainLayout - Wrapped with ProtectedRoute */}
                {appRoutes.map((route, index) => {
                  const Component = route.component;
                  return (
                    <Route
                      key={index}
                      path={route.path}
                      element={
                        <ProtectedRoute>
                          <MainLayout>
                            <Suspense fallback={<FallbackLoader />}>
                              {route.isEdit ? (
                                <Component isEdit={true} />
                              ) : (
                                <Component />
                              )}
                            </Suspense>
                          </MainLayout>
                        </ProtectedRoute>
                      }
                    />
                  );
                })}

                {/* Not Found Route */}
                <Route
                  path="*"
                  element={
                    <MainLayout>
                      <NotFound />
                    </MainLayout>
                  }
                />
              </Routes>
            </Suspense>
          </Router>
        </ProtectedRoute>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
