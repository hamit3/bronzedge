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
    const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
    const [readStatus, setReadStatus] = useState<string>("All");

    const devicesQuery = useList({
        resource: "devices",
        filters: [{ field: "organization_id", operator: "eq", value: activeOrgId }],
        pagination: { pageSize: 1000 },
        queryOptions: { enabled: !!activeOrgId }
    });
    const devicesData = devicesQuery.query?.data?.data || [];

    return (
        <div style={{ padding: "24px", minHeight: "100vh" }}>
            <PageHeader 
                title="Events" 
                subtitle={`Global event log for all organizational activity — ${new Date().toLocaleDateString('tr-TR')}`} 
            />

            <FilterContainer title="Event Filters">
                <Select
                    mode="multiple"
                    placeholder="Filter Devices"
                    style={{ minWidth: 160 }}
                    value={selectedDevices}
                    onChange={(val) => setSelectedDevices(val)}
                    allowClear
                    maxTagCount="responsive"
                    className="premium-select"
                >
                    {devicesData.map((device: any) => (
                        <Select.Option key={device.id} value={device.id}>
                            {device.name}
                        </Select.Option>
                    ))}
                </Select>

                <Select
                    mode="multiple"
                    placeholder="Filter Rule Types"
                    style={{ minWidth: 160 }}
                    value={selectedTypes}
                    onChange={(val) => setSelectedTypes(val)}
                    allowClear
                    maxTagCount="responsive"
                    className="premium-select"
                >
                    {RULE_TYPES.map((rt) => (
                        <Select.Option key={rt.value} value={rt.value}>
                            {rt.label}
                        </Select.Option>
                    ))}
                </Select>

                <RangePicker
                    showTime
                    onChange={(dates) => setDateRange(dates as any)}
                    style={{ 
                        minWidth: 320,
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.1)",
                    }}
                    className="premium-datepicker"
                />

                <Segmented
                    options={["All", "Unread"]}
                    value={readStatus}
                    onChange={(val) => setReadStatus(val as string)}
                    style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        padding: 2
                    }}
                />
            </FilterContainer>

            <Card variant="borderless" className="shadow-premium">
                <EventsTab 
                    selectedDevices={selectedDevices}
                    selectedTypes={selectedTypes}
                    dateRange={dateRange}
                    readStatus={readStatus}
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
