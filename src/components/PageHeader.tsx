import React from "react";
import { Typography, Space } from "antd";

const { Title, Text } = Typography;

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    extra?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, extra }) => {
    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'baseline', 
            flexWrap: 'wrap', 
            gap: '16px',
            marginBottom: '24px'
        }}>
            <div>
                <Title level={2} style={{ 
                    color: "#f88601", 
                    margin: 0,
                    fontSize: '24px',
                    fontWeight: 700,
                    letterSpacing: '-0.5px'
                }}>
                    {title}
                </Title>
                {subtitle && (
                    <Text type="secondary" style={{ 
                        fontSize: '13px',
                        color: 'rgba(255, 255, 255, 0.45)'
                    }}>
                        {subtitle}
                    </Text>
                )}
            </div>
            {extra && (
                <Space size="middle">
                    {extra}
                </Space>
            )}
        </div>
    );
};
