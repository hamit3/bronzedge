import React from "react";
import { FilterOutlined } from "@ant-design/icons";

interface FilterContainerProps {
    title: string;
    children: React.ReactNode;
    style?: React.CSSProperties;
    extra?: React.ReactNode;
}

export const FilterContainer: React.FC<FilterContainerProps> = ({ title, children, style, extra }) => {
    return (
        <div
            style={{
                background: "rgba(13, 20, 36, 0.95)",
                backdropFilter: "blur(16px)",
                padding: "12px 16px",
                borderRadius: "14px",
                border: "1px solid rgba(248, 134, 1, 0.2)",
                boxShadow: "0 12px 40px rgba(0, 0, 0, 0.6)",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
                width: "100%",
                marginBottom: "24px",
                boxSizing: "border-box",
                ...style
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <FilterOutlined style={{ color: '#f88601', fontSize: '16px' }} />
                <span style={{
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    whiteSpace: 'nowrap',
                }}>
                    {title}
                </span>
            </div>

            {children && (
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    flexWrap: 'wrap',
                    flex: '1 1 auto',
                    minWidth: 0,
                }}>
                    {children}
                </div>
            )}

            {extra && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                    justifyContent: 'flex-end',
                    marginLeft: 'auto'
                }}>
                    {extra}
                </div>
            )}
        </div>
    );
};
