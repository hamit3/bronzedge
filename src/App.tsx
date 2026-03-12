import { Refine, Authenticated } from "@refinedev/core";
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
  UserOutlined,
  EnvironmentOutlined,
  BellOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
  SettingOutlined,
  HistoryOutlined,
  LineChartOutlined,
  BankOutlined,
  DesktopOutlined,
  AimOutlined,
} from "@ant-design/icons";

import { ActivityAnalysisPage } from "./pages/reports/ActivityAnalysisPage";
import { LocationPlaybackPage } from "./pages/reports/LocationPlaybackPage";
import { AlertsPage } from "./pages/alerts";
import { Header } from "./components/header";
import { ErrorPage } from "./pages/error";
import { ShowcasePage } from "./pages/showcase";
import { MapsPage } from "./pages/maps/MapsPage";
import { OrganizationsPage } from "./pages/account/OrganizationsPage";
import { DevicesPage } from "./pages/account/DevicesPage";
import { GeofencingPage } from "./pages/account/GeofencingPage";
import { ProfilePage } from "./pages/account/ProfilePage";
import { UpdatePasswordPage } from "./pages/update-password";
import { RulesPage } from "./pages/rules";
import { EventsPage } from "./pages/events";
import { RulesMenuLabel } from "./pages/rules/RulesMenuLabel";
import { AdminPanelPage } from "./pages/admin";
import { DesktopOnlyWrapper } from "./components/DesktopOnlyWrapper";

import { MAP_LIBRARIES } from "./utils/mapUtils";

function App() {
  // Prevent Google Maps wrapper from removing the script on route changes
  // by holding a persistent reference to the loader at the root level.
  // Use the common library list to prevent initialization conflicts.
  useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: MAP_LIBRARIES,
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
            .ant-layout-content {
              height: 100%;
              overflow-y: auto !important;
              scroll-behavior: smooth;
            }
            .ant-layout-sider {
              height: 100vh;
              overflow-y: auto;
            }
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

            /* Premium UI Consistency Overrides */
            .shadow-premium {
              box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5) !important;
            }
            .ant-card.shadow-premium, .account-card.shadow-premium {
              background: #0d1424 !important;
              border: 1px solid rgba(255, 255, 255, 0.06) !important;
              border-radius: 12px !important;
            }
            .ant-table {
              background: transparent !important;
            }
            .ant-table-thead > tr > th {
              background: rgba(255, 255, 255, 0.03) !important;
              color: rgba(255, 255, 255, 0.45) !important;
              border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
              font-size: 11px !important;
              text-transform: uppercase !important;
              letter-spacing: 0.6px !important;
              padding: 12px 16px !important;
            }
            .ant-table-tbody > tr > td {
              border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
            }
            .ant-table-tbody > tr:hover > td {
              background: rgba(248, 134, 1, 0.06) !important;
            }
            .ant-tabs-tab {
              color: rgba(255, 255, 255, 0.45) !important;
            }
            .ant-tabs-tab-active .ant-tabs-tab-btn {
              color: #f88601 !important;
              font-weight: 600 !important;
            }
            .ant-tabs-ink-bar {
              background: #f88601 !important;
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
              color: #333 !important;
              background-color: #fff !important;
            }
            .gm-style-mtc ul {
              background-color: #ffffff !important;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3) !important;
            }
          `}</style>
          <AntdApp>
            <DesktopOnlyWrapper>
              <OrganizationProvider>
                <Refine
                  notificationProvider={useNotificationProvider}
                  dataProvider={dataProvider}
                  liveProvider={liveProvider(supabaseClient)}
                  authProvider={authProvider}
                  routerProvider={routerProvider}
                  accessControlProvider={{
                    can: async ({ resource }) => {
                      if (resource === "admin") {
                        const role = await authProvider.getPermissions?.();
                        return { can: role === "admin" };
                      }
                      return { can: true };
                    },
                  }}
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
                      name: "activity-analysis",
                      list: "/activity-analysis",
                      meta: {
                        label: "Activity Analysis",
                        icon: <LineChartOutlined />,
                      },
                    },
                    {
                      name: "location-playback",
                      list: "/location-playback",
                      meta: {
                        label: "Location Playback",
                        icon: <HistoryOutlined />,
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
                      name: "admin",
                      list: "/admin",
                      meta: {
                        label: "Admin",
                        icon: <SettingOutlined />,
                      },
                    },
                    {
                      name: "organizations",
                      list: "/organizations",
                      meta: {
                        label: "Organizations",
                        icon: <BankOutlined />,
                      },
                    },
                    {
                      name: "devices-list",
                      list: "/devices-list",
                      meta: {
                        label: "Devices",
                        icon: <DesktopOutlined />,
                      },
                    },
                    {
                      name: "geofencing",
                      list: "/geofencing",
                      meta: {
                        label: "Geofencing",
                        icon: <AimOutlined />,
                      },
                    },
                    {
                      name: "profile",
                      list: "/profile",
                      meta: {
                        label: "My Profile",
                        icon: <UserOutlined />,
                      },
                    },
                  ]}
                  options={{
                    syncWithLocation: true,
                    warnWhenUnsavedChanges: true,
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
                      <Route path="/activity-analysis" element={<ActivityAnalysisPage />} />
                      <Route path="/location-playback" element={<LocationPlaybackPage />} />
                      <Route path="/alerts" element={<AlertsPage />} />
                      <Route path="/rules" element={<RulesPage />} />
                      <Route path="/events" element={<EventsPage />} />
                      <Route path="/admin" element={<AdminPanelPage />} />
                      <Route path="/organizations" element={<OrganizationsPage />} />
                      <Route path="/devices-list" element={<DevicesPage />} />
                      <Route path="/geofencing" element={<GeofencingPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
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
                  <DocumentTitleHandler
                    handler={({ resource }) => {
                      const resourceName = resource?.meta?.label || resource?.name || "";
                      if (!resourceName) return "BronzEdge";
                      return `${resourceName} | BronzEdge`;
                    }}
                  />
                </Refine>
              </OrganizationProvider>
            </DesktopOnlyWrapper>
          </AntdApp>
        </RefineKbarProvider>
      </ConfigProvider>
    </BrowserRouter>
  );
}

export default App;
