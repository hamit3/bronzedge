import { Refine, Authenticated } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import { useNotificationProvider, ThemedLayout, ThemedSider } from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";

import routerProvider, {
  CatchAllNavigate,
  DocumentTitleHandler,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";
import { liveProvider } from "@refinedev/supabase";
import { App as AntdApp, ConfigProvider, theme, Tooltip, Badge } from "antd";
import { BrowserRouter, Route, Routes, Outlet, Link } from "react-router";
import { useJsApiLoader } from "@react-google-maps/api";
import authProvider from "./providers/auth";
import { dataProvider } from "./providers/data";
import { supabaseClient } from "./providers/supabase-client";
import { LoginPage } from "./pages/login";
import { OrganizationProvider } from "./contexts/organization";

import {
  BarChartOutlined,
  FileTextOutlined,
  UserOutlined,
  EnvironmentOutlined,
  BellOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";

import { ReportList } from "./pages/reports";
import { AlertsPage } from "./pages/alerts";
import { Header } from "./components/header";
import { ErrorPage } from "./pages/error";
import { ShowcasePage } from "./pages/showcase";
import { MapsPage } from "./pages/maps/MapsPage";
import { AccountPage } from "./pages/account";
import { UpdatePasswordPage } from "./pages/update-password";
import { RulesPage } from "./pages/rules";
import { EventsPage } from "./pages/events";
import { RulesMenuLabel } from "./pages/rules/RulesMenuLabel";

const libraries: ("drawing" | "geometry" | "places")[] = ["drawing", "geometry", "places"];

function App() {
  // Prevent Google Maps wrapper from removing the script on route changes
  // by holding a persistent reference to the loader at the root level.
  useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  return (
    <BrowserRouter>
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: "#f88601",
            borderRadius: 6,
            fontSize: 13,
            colorTextSecondary: "rgba(255, 255, 255, 0.65)",
            colorBgLayout: "#050a14",
            colorBgContainer: "#0d1424",
            colorBgElevated: "#161f33",
          },
          components: {
            Typography: {
              fontSizeHeading1: 22,
              fontSizeHeading2: 18,
              fontSizeHeading3: 16,
              fontSizeHeading4: 14,
              fontSizeHeading5: 13,
            },
            Button: {
              colorPrimary: "#f88601",
              colorPrimaryHover: "#ff9d2e",
              colorPrimaryActive: "#e67a00",
              controlHeight: 32,
            },
            Input: {
              colorPrimary: "#f88601",
              activeBorderColor: "#f88601",
              hoverBorderColor: "#f88601",
              controlHeight: 32,
            },
            Select: {
              colorPrimary: "#f88601",
              controlHeight: 32,
            },
            DatePicker: {
              colorPrimary: "#f88601",
              controlHeight: 32,
            },
            Card: {
              paddingLG: 16,
            },
            Layout: {
              headerPadding: "0 20px",
            },
          },
        }}
      >
        <RefineKbarProvider>
          <style>{`
            html, body, #root {
              height: 100%;
              margin: 0;
              overflow: hidden;
            }
            .ant-layout {
              height: 100vh;
              overflow: hidden;
            }
            /* Make the content area scrollable */
            .ant-layout-content {
              height: 100%;
              overflow-y: auto !important;
              scroll-behavior: smooth;
            }
            /* Ensure the sider is fixed height and scrollable if items are too many */
            .ant-layout-sider {
              height: 100vh;
              overflow-y: auto;
            }
            /* Optional: customize scrollbar for premium look */
            .ant-layout-content::-webkit-scrollbar {
              width: 6px;
            }
            .ant-layout-content::-webkit-scrollbar-track {
              background: transparent;
            }
            .ant-layout-content::-webkit-scrollbar-thumb {
              background: rgba(248, 134, 1, 0.2);
              border-radius: 3px;
            }
            .ant-layout-content::-webkit-scrollbar-thumb:hover {
              background: rgba(248, 134, 1, 0.4);
            }
            /* Google Maps Control Enhancement */
            .gm-style-mtc > button, 
            .gm-style-mtc ul li,
            .gm-control-active {
              font-size: 13px !important;
              font-weight: 500 !important;
              padding: 0 12px !important;
              height: 32px !important;
              display: flex !important;
              align-items: center !important;
              color: #333 !important; /* Default dark text for the main buttons if they are light */
              background-color: #fff !important;
            }
            /* Specifically target the dropdown menu for Satellite options (Labels etc) */
            .gm-style-mtc ul {
              background-color: #ffffff !important;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3) !important;
            }
            .gm-style-mtc ul li {
              color: #333 !important;
              background-color: #ffffff !important;
              cursor: pointer !important;
            }
            .gm-style-mtc ul li:hover {
              background-color: #f0f0f0 !important;
            }
            /* Transition for better feel */
            .gm-style-mtc > button, .gm-style-mtc ul li {
              transition: background-color 0.2s ease;
            }
          `}</style>
          <AntdApp>
            <OrganizationProvider>
              <DevtoolsProvider>
                <Refine
                  notificationProvider={useNotificationProvider}
                  dataProvider={dataProvider}
                  liveProvider={liveProvider(supabaseClient)}
                  authProvider={authProvider}
                  routerProvider={routerProvider}
                  resources={[
                    {
                      name: "monitoring",
                      list: "/monitoring",
                      meta: {
                        label: "Monitoring",
                        icon: <BarChartOutlined />,
                      },
                    },
                    {
                      name: "maps",
                      list: "/maps",
                      meta: {
                        label: "Maps",
                        icon: <EnvironmentOutlined />,
                      },
                    },
                    {
                      name: "reports",
                      list: "/reports",
                      meta: {
                        label: "Reports",
                        icon: <BarChartOutlined />,
                      },
                    },
                    {
                      name: "alerts",
                      list: "/alerts",
                      meta: {
                        label: "Alerts",
                        icon: <BellOutlined />,
                      },
                    },
                    {
                      name: "rules",
                      list: "/rules",
                      meta: {
                        label: "Rules",
                        icon: <ThunderboltOutlined />,
                      },
                    },
                    {
                      name: "events",
                      list: "/events",
                      meta: {
                        label: "Events",
                        icon: <UnorderedListOutlined />,
                      },
                    },
                    {
                      name: "account",
                      list: "/account",
                      meta: {
                        label: "Account",
                        icon: <UserOutlined />,
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
                            Header={Header}
                            Sider={(props) => (
                              <ThemedSider
                                {...props}
                                render={({ items }: { items: React.ReactNode; logout: React.ReactNode }) => items}
                              />
                            )}
                            Title={({ collapsed }) => (
                              <Link to="/monitoring" style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "12px 0",
                                width: "100%",
                                transition: "all 0.3s",
                                textDecoration: "none"
                              }}>
                                {collapsed ? (
                                  <img
                                    src="/logo-icon.png"
                                    alt="Icon"
                                    style={{ width: "28px", height: "auto" }}
                                  />
                                ) : (
                                  <img
                                    src="/BronzEdge_Logo.png"
                                    alt="Logo"
                                    style={{ width: "140px", height: "auto" }}
                                  />
                                )}
                              </Link>
                            )}
                          >
                            <Outlet />

                            {/* Floating System Status */}
                            <div
                              style={{
                                position: "fixed",
                                bottom: "24px",
                                right: "24px",
                                zIndex: 1000,
                                pointerEvents: "none",
                              }}
                            >
                              <Tooltip
                                title="System Health: Operational"
                                placement="left"
                              >
                                <div
                                  style={{
                                    pointerEvents: "auto",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    padding: "6px 14px",
                                    backgroundColor: "rgba(13, 20, 36, 0.7)",
                                    backdropFilter: "blur(8px)",
                                    borderRadius: "20px",
                                    border: "1px solid rgba(82, 196, 26, 0.3)",
                                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                                    cursor: "help",
                                  }}
                                >
                                  <Badge status="processing" color="#52c41a" />
                                  <span
                                    style={{
                                      color: "#52c41a",
                                      fontSize: "11px",
                                      fontWeight: 600,
                                      letterSpacing: "0.5px",
                                    }}
                                  >
                                    HEALTHY
                                  </span>
                                </div>
                              </Tooltip>
                            </div>
                          </ThemedLayout>
                        </Authenticated>
                      }
                    >
                      <Route
                        index
                        element={<CatchAllNavigate to="/monitoring" />}
                      />
                      <Route path="/monitoring" element={<ShowcasePage />} />
                      <Route path="/maps" element={<MapsPage />} />
                      <Route path="/reports" element={<ReportList />} />
                      <Route path="/alerts" element={<AlertsPage />} />
                      <Route path="/rules" element={<RulesPage />} />
                      <Route path="/events" element={<EventsPage />} />
                      <Route path="/account" element={<AccountPage />} />
                    </Route>
                    <Route
                      element={
                        <Authenticated
                          key="authenticated-outer"
                          fallback={<Outlet />}
                        >
                          <CatchAllNavigate to="/monitoring" />
                        </Authenticated>
                      }
                    >
                      <Route path="/login" element={<LoginPage />} />
                    </Route>
                    <Route path="*" element={<ErrorPage />} />
                    {/* Public — accessible from password reset email */}
                    <Route
                      path="/update-password"
                      element={<UpdatePasswordPage />}
                    />
                  </Routes>
                  <RefineKbar />
                  <UnsavedChangesNotifier />
                  <DocumentTitleHandler />
                </Refine>
                <DevtoolsPanel />
              </DevtoolsProvider>
            </OrganizationProvider>
          </AntdApp>
        </RefineKbarProvider>
      </ConfigProvider>
    </BrowserRouter>
  );
}

export default App;
