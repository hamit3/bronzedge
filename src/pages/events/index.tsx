import React, { useState } from "react";
import { Card, Select, DatePicker, Segmented } from "antd";
import { useList } from "@refinedev/core";
import { EventsTab } from "../rules/EventsTab";
import { PageHeader } from "../../components/PageHeader";
import { FilterContainer } from "../../components/FilterContainer";
import { RULE_TYPES } from "../rules/utils";
import dayjs from "dayjs";
import { useOrganization } from "../../contexts/organization";

const { RangePicker } = DatePicker;

export const EventsPage = () => {
    const { activeOrgId } = useOrganization();

    // Filters State
    const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [quickFilter, setQuickFilter] = useState<string>("24h");
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>([
        dayjs().subtract(24, "hour"),
        dayjs().endOf("day")
    ]);

    const devicesQuery = useList({
        resource: "devices",
        filters: [{ field: "organization_id", operator: "eq", value: activeOrgId }],
        pagination: { pageSize: 1000 },
        queryOptions: { enabled: !!activeOrgId }
    });
    const devicesData = devicesQuery.query?.data?.data || [];

    const handleQuickFilter = (value: string) => {
        setQuickFilter(value);
        if (value === "all") {
            setDateRange([dayjs().subtract(1, "year").startOf("day"), dayjs().endOf("day")]);
            return;
        }

        const end = dayjs().endOf("day");
        let start = dayjs().subtract(7, "day").startOf("day");

        if (value === "24h") start = dayjs().subtract(24, "hour");
        else if (value === "7d") start = dayjs().subtract(7, "day").startOf("day");
        else if (value === "30d") start = dayjs().subtract(30, "day").startOf("day");

        setDateRange([start, end]);
    };

    const handleDateChange = (dates: any) => {
        if (dates && dates[0] && dates[1]) {
            setDateRange([dates[0], dates[1]]);
            setQuickFilter("custom");
        }
    };

    return (
        <div style={{ padding: "24px", minHeight: "100vh" }}>
            <PageHeader 
                title="Events" 
                subtitle={`Global event log for all organizational activity — ${new Date().toLocaleDateString('tr-TR')}`} 
            />

            <FilterContainer 
                title="Event Filters"
                style={{ flexWrap: 'nowrap' }}
                extra={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'nowrap' }}>
                        <Segmented
                            options={[
                                { label: '24H', value: '24h' },
                                { label: '7D', value: '7d' },
                                { label: '30D', value: '30d' },
                                { label: 'All', value: 'all' },
                                { label: 'Cust', value: 'custom', disabled: true },
                            ]}
                            value={quickFilter}
                            onChange={(value) => handleQuickFilter(value as string)}
                            style={{
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                padding: 2
                            }}
                        />

                        <RangePicker
                            showTime
                            value={dateRange}
                            onChange={handleDateChange}
                            style={{ 
                                width: 280,
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.1)",
                            }}
                            className="premium-datepicker"
                            disabled={quickFilter === "all"}
                        />
                    </div>
                }
            >
                <Select
                    placeholder="All Devices"
                    style={{ width: 180 }}
                    value={selectedDevice}
                    onChange={(val) => setSelectedDevice(val)}
                    allowClear
                    showSearch
                    optionFilterProp="children"
                    className="premium-select"
                >
                    {devicesData.map((device: any) => (
                        <Select.Option key={device.id} value={device.id}>
                            {device.name}
                        </Select.Option>
                    ))}
                </Select>

                <Select
                    placeholder="All Rule Types"
                    style={{ width: 150 }}
                    value={selectedType}
                    onChange={(val) => setSelectedType(val)}
                    allowClear
                    showSearch
                    optionFilterProp="children"
                    className="premium-select"
                >
                    {RULE_TYPES.map((rt) => (
                        <Select.Option key={rt.value} value={rt.value}>
                            {rt.label}
                        </Select.Option>
                    ))}
                </Select>
            </FilterContainer>

            <Card variant="borderless" className="shadow-premium">
                <EventsTab 
                    key={activeOrgId}
                    selectedDevices={selectedDevice ? [selectedDevice] : []}
                    selectedTypes={selectedType ? [selectedType] : []}
                    dateRange={dateRange}
                    readStatus="All"
                />
            </Card>

            <style>{`
                .premium-select .ant-select-selector {
                    background: rgba(255,255,255,0.03) !important;
                    border: 1px solid rgba(255,255,255,0.1) !important;
                }
                .premium-datepicker input {
                    color: #fff !important;
                }
                .ant-segmented {
                    background: rgba(255,255,255,0.03) !important;
                    color: rgba(255,255,255,0.45) !important;
                }
            `}</style>
        </div>
    );
};
