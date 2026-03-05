import { Refine, Authenticated } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import { useNotificationProvider, ThemedLayout, ErrorComponent } from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";

import routerProvider, {
  CatchAllNavigate,
  DocumentTitleHandler,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";
import { liveProvider } from "@refinedev/supabase";
import { App as AntdApp, ConfigProvider, theme } from "antd";
import { BrowserRouter, Route, Routes, Outlet } from "react-router";
import authProvider from "./providers/auth";
import { dataProvider } from "./providers/data";
import { supabaseClient } from "./providers/supabase-client";
import { LoginPage } from "./pages/login";
import { DashboardPage } from "./pages/dashboard";

import {
  DashboardOutlined,
  DesktopOutlined,
  BarChartOutlined,
  AlertOutlined,
  FileTextOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { DeviceList } from "./pages/devices";
import { MonitoringPage } from "./pages/monitoring";
import { AlertList } from "./pages/alerts";
import { ReportList } from "./pages/reports";
import { SettingsPage } from "./pages/settings";

function App() {
  return (
    <BrowserRouter>
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: "#f88601",
            borderRadius: 8,
          },
          components: {
            Button: {
              colorPrimary: "#f88601",
              colorPrimaryHover: "#ff9d2e",
              colorPrimaryActive: "#e67a00",
            },
            Input: {
              colorPrimary: "#f88601",
              activeBorderColor: "#f88601",
              hoverBorderColor: "#f88601",
            },
          },
        }}
      >
        <RefineKbarProvider>
          <AntdApp>
            <DevtoolsProvider>
              <Refine
                notificationProvider={useNotificationProvider}
                dataProvider={dataProvider}
                liveProvider={liveProvider(supabaseClient)}
                authProvider={authProvider}
                routerProvider={routerProvider}
                resources={[
                  {
                    name: "dashboard",
                    list: "/dashboard",
                    meta: {
                      label: "Dashboard",
                      icon: <DashboardOutlined />,
                    },
                  },
                  {
                    name: "devices",
                    list: "/devices",
                    meta: {
                      label: "Assets & Devices",
                      icon: <DesktopOutlined />,
                    },
                  },
                  {
                    name: "monitoring",
                    list: "/monitoring",
                    meta: {
                      label: "Monitoring",
                      icon: <BarChartOutlined />,
                    },
                  },
                  {
                    name: "alerts",
                    list: "/alerts",
                    meta: {
                      label: "Alerts",
                      icon: <AlertOutlined />,
                    },
                  },
                  {
                    name: "reports",
                    list: "/reports",
                    meta: {
                      label: "Reports",
                      icon: <FileTextOutlined />,
                    },
                  },
                  {
                    name: "settings",
                    list: "/settings",
                    meta: {
                      label: "Settings",
                      icon: <SettingOutlined />,
                    },
                  },
                ]}
                options={{
                  syncWithLocation: true,
                  warnWhenUnsavedChanges: true,
                  projectId: "qAQyh8-824O2c-uPhcpp",
                }}
              >
                <Routes>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-inner"
                        fallback={<CatchAllNavigate to="/login" />}
                      >
                        <ThemedLayout
                          Title={({ collapsed }) => (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '16px 0'
                            }}>
                              <img src="/BronzEdge_Logo.png" alt="Logo" style={{ height: '24px' }} />
                              {!collapsed && <span style={{ fontWeight: 'bold', fontSize: '18px' }}>Bronzedge</span>}
                            </div>
                          )}
                        >
                          <Outlet />
                        </ThemedLayout>
                      </Authenticated>
                    }
                  >
                    <Route index element={<CatchAllNavigate to="/dashboard" />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/devices" element={<DeviceList />} />
                    <Route path="/monitoring" element={<MonitoringPage />} />
                    <Route path="/alerts" element={<AlertList />} />
                    <Route path="/reports" element={<ReportList />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Route>
                  <Route
                    element={
                      <Authenticated key="authenticated-outer" fallback={<Outlet />}>
                        <CatchAllNavigate to="/dashboard" />
                      </Authenticated>
                    }
                  >
                    <Route path="/login" element={<LoginPage />} />
                  </Route>
                  <Route path="*" element={<ErrorComponent />} />
                </Routes>
                <RefineKbar />
                <UnsavedChangesNotifier />
                <DocumentTitleHandler />
              </Refine>
              <DevtoolsPanel />
            </DevtoolsProvider>
          </AntdApp>
        </RefineKbarProvider>
      </ConfigProvider>
    </BrowserRouter>
  );
}

export default App;
