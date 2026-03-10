import React from "react";
import {
    Input,
    Select,
    DatePicker,
    Segmented,
    ConfigProvider,
    theme,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { Dayjs } from "dayjs";
import { FilterContainer } from "../../components/FilterContainer";

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
        <FilterContainer 
            title="Control Panel"
            style={{ marginBottom: 0 }} // Overriding standard bottom margin as it's handled by the parent layout
            extra={
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
            }
        >
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
        </FilterContainer>
    );
};
