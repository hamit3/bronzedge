import React, { useState, useEffect } from "react";
import { Typography, Space, Button } from "antd";
import { DesktopOutlined, LaptopOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export const DesktopOnlyWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkSize = () => {
      // Typically desktop starts at 1024px
      setIsMobile(window.innerWidth < 1024);
    };

    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  if (isMobile) {
    return (
      <div
        style={{
          height: "100vh",
          width: "100vw",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
          textAlign: "center",
          background: "#050a14",
          color: "#fff",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 99999,
        }}
      >
        <div 
          style={{ 
            width: "80px", 
            height: "80px", 
            borderRadius: "20px", 
            background: "rgba(248, 134, 1, 0.1)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            marginBottom: "24px",
            border: "1px solid rgba(248, 134, 1, 0.2)"
          }}
        >
          <DesktopOutlined style={{ fontSize: "40px", color: "#f88601" }} />
        </div>
        
        <Title level={2} style={{ color: "#f88601", marginBottom: "16px" }}>
          Desktop Experience Only
        </Title>
        
        <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: "16px", maxWidth: "400px", display: "block", marginBottom: "32px" }}>
          The BronzEdge platform is optimized for professional monitoring and configuration on larger screens. Please use a computer or a device with a wider screen to access the application.
        </Text>

        <Button 
          type="primary" 
          size="large" 
          href="https://bronzedge.com"
          style={{ 
            marginBottom: "40px",
            height: "44px",
            padding: "0 32px",
            fontWeight: 600
          }}
        >
          Return to Website
        </Button>

        <div style={{ display: "flex", gap: "12px", alignItems: "center", color: "rgba(255,255,255,0.35)" }}>
           <LaptopOutlined />
           <Text style={{ color: "inherit", fontSize: "12px" }}>Best viewed on 1024px or higher</Text>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
