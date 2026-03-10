import React from "react";
import {
    Input,
    Select,
    DatePicker,
    Segmented,
    ConfigProvider,
    theme,
} from "antd";
import { SearchOutlined, FilterOutlined } from "@ant-design/icons";
import { Dayjs } from "dayjs";

const { RangePicker } = DatePicker;

interface MapFiltersProps {
    searchText: string;
    setSearchText: (text: string) => void;
    statusFilter: "all" | "active" | "inactive";
    setStatusFilter: (status: "all" | "active" | "inactive") => void;
    lastSeenFilter: string;
    setLastSeenFilter: (filter: string) => void;
    timeRange: [Dayjs, Dayjs] | null;
    setTimeRange: (range: [Dayjs, Dayjs] | null) => void;
}

export const MapFilters: React.FC<MapFiltersProps> = ({
    searchText,
    setSearchText,
    statusFilter,
    setStatusFilter,
    lastSeenFilter,
    setLastSeenFilter,
    timeRange,
    setTimeRange,
}) => {
    return (
        <ConfigProvider
            theme={{
                algorithm: theme.darkAlgorithm,
                token: {
                    colorPrimary: '#f88601',
                    borderRadius: 8,
                },
                components: {
                    Segmented: {
                        itemSelectedBg: '#f88601',
                        itemSelectedColor: '#fff',
                        trackBg: 'rgba(255,255,255,0.04)',
                        itemActiveBg: 'rgba(248,134,1,0.2)',
                    },
                    Input: {
                        activeBorderColor: '#f88601',
                        hoverBorderColor: '#f88601',
                    },
                    Select: {
                        optionSelectedBg: 'rgba(248,134,1,0.15)',
                    }
                }
            }}
        >
            <div
                style={{
                    background: "rgba(20, 20, 20, 0.9)",
                    backdropFilter: "blur(16px)",
                    padding: "16px 20px",
                    borderRadius: "14px",
                    border: "1px solid rgba(248, 134, 1, 0.2)",
                    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                    flexWrap: "wrap",
                    width: "100%",
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '4px' }}>
                        <FilterOutlined style={{ color: '#f88601', fontSize: '18px' }} />
                        <span style={{ color: '#fff', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Control Panel</span>
                    </div>

                    <Input
                        placeholder="Search devices..."
                        prefix={<SearchOutlined style={{ color: "rgba(255,255,255,0.25)" }} />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        allowClear
                        style={{ width: '180px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />

                    <Segmented
                        value={statusFilter}
                        onChange={(v) => setStatusFilter(v as any)}
                        options={[
                            { label: "ALL", value: "all" },
                            { label: "ACTIVE", value: "active" },
                            { label: "INACTIVE", value: "inactive" },
                        ]}
                        className="premium-segmented"
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <Select
                        style={{ width: "130px" }}
                        value={lastSeenFilter}
                        onChange={setLastSeenFilter}
                        options={[
                            { label: "Any time", value: "any" },
                            { label: "Last 1h", value: "1h" },
                            { label: "Last 6h", value: "6h" },
                            { label: "Last 24h", value: "24h" },
                            { label: "Last 7d", value: "7d" },
                        ]}
                        dropdownStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }}
                    />

                    <RangePicker
                        style={{
                            width: "320px",
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}
                        showTime
                        value={timeRange}
                        onChange={(val) => setTimeRange(val as any)}
                    />
                </div>

                <style>{`
                    .premium-segmented .ant-segmented-item-label {
                        font-weight: 700;
                        font-size: 11px;
                        padding: 0 16px;
                    }
                    .premium-segmented.ant-segmented {
                        padding: 3px;
                    }
                    .ant-segmented-item-selected {
                        box-shadow: 0 2px 8px rgba(248, 134, 1, 0.4);
                    }
                `}</style>
            </div>
        </ConfigProvider>
    );
};
