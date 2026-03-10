import React, { useMemo } from "react";
import { Row, Col, Card, Statistic, Table, Tag, Tooltip, Progress, Typography, Empty, Space } from "antd";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import dayjs from "dayjs";
import { Session, DayGroup, ShiftData, ShiftType } from "./types";
import { formatDuration, groupSessionsByDay, getShift } from "./utils";

const { Title, Text } = Typography;

interface ActivityTabProps {
    sessions: Session[];
}

export const ActivityTab: React.FC<ActivityTabProps> = ({ sessions }) => {
    if (sessions.length === 0) {
        return <Empty description="No activity data for this period" style={{ padding: "40px 0" }} />;
    }

    const totalDuration = useMemo(() => sessions.reduce((acc, s) => acc + s.duration, 0), [sessions]);
    const activeTime = useMemo(() => sessions.filter(s => s.isMoving).reduce((acc, s) => acc + s.duration, 0), [sessions]);
    const idleTime = useMemo(() => sessions.filter(s => !s.isMoving).reduce((acc, s) => acc + s.duration, 0), [sessions]);
    const utilizationRate = useMemo(() => (totalDuration > 0 ? (activeTime / totalDuration) * 100 : 0), [activeTime, totalDuration]);
    const activityCount = useMemo(() => {
        // Number of movement sessions (transitions from idle to moving)
        let counts = 0;
        for (let i = 0; i < sessions.length; i++) {
            if (sessions[i].isMoving && (i === 0 || !sessions[i - 1].isMoving)) {
                counts++;
            }
        }
        return counts;
    }, [sessions]);

    const dailyData = useMemo(() => {
        return groupSessionsByDay(sessions).map(day => ({
            date: day.date,
            activeHours: Number((day.activeDuration / 3600).toFixed(2)),
            idleHours: Number((day.idleDuration / 3600).toFixed(2)),
            utilization: Math.round((day.activeDuration / day.totalDuration) * 100),
        }));
    }, [sessions]);

    const shiftData = useMemo(() => {
        const shifts: Record<ShiftType, { active: number, total: number }> = {
            morning: { active: 0, total: 0 },
            afternoon: { active: 0, total: 0 },
            night: { active: 0, total: 0 },
        };

        sessions.forEach(s => {
            const shift = getShift(s.start);
            shifts[shift].total += s.duration;
            if (s.isMoving) shifts[shift].active += s.duration;
        });

        return (Object.keys(shifts) as ShiftType[]).map(key => ({
            shift: key,
            activeDuration: shifts[key].active,
            totalDuration: shifts[key].total,
            utilization: shifts[key].total > 0 ? Math.round((shifts[key].active / shifts[key].total) * 100) : 0,
        }));
    }, [sessions]);

    const columns = [
        {
            title: "Start Time",
            dataIndex: "start",
            key: "start",
            render: (val: string) => dayjs(val).format("YYYY-MM-DD HH:mm:ss"),
            sorter: (a: Session, b: Session) => dayjs(a.start).unix() - dayjs(b.start).unix(),
        },
        {
            title: "End Time",
            dataIndex: "end",
            key: "end",
            render: (val: string) => dayjs(val).format("YYYY-MM-DD HH:mm:ss"),
        },
        {
            title: "Duration",
            dataIndex: "duration",
            key: "duration",
            render: (val: number) => formatDuration(val),
            sorter: (a: Session, b: Session) => a.duration - b.duration,
        },
        {
            title: "Status",
            dataIndex: "isMoving",
            key: "status",
            render: (isMoving: boolean) => (
                <Tag color={isMoving ? "green" : "default"}>
                    {isMoving ? "Moving" : "Idle"}
                </Tag>
            ),
        },
        {
            title: "Orientation",
            dataIndex: "orientation",
            key: "orientation",
        },
    ];

    const getUtilizationColor = (rate: number) => {
        if (rate > 60) return "#52c41a";
        if (rate > 30) return "#faad14";
        return "#ff4d4f";
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* KPI Cards */}
            <Row gutter={16}>
                <Col span={6}>
                    <Card bordered={false} className="kpi-card">
                        <Statistic
                            title="Total Active Time"
                            value={formatDuration(activeTime)}
                            valueStyle={{ color: "#52c41a" }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card bordered={false} className="kpi-card">
                        <Statistic
                            title="Total Idle Time"
                            value={formatDuration(idleTime)}
                            valueStyle={{ color: "rgba(255, 255, 255, 0.45)" }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card bordered={false} className="kpi-card">
                        <Statistic
                            title="Utilization Rate"
                            value={utilizationRate}
                            precision={1}
                            suffix="%"
                            valueStyle={{ color: getUtilizationColor(utilizationRate) }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card bordered={false} className="kpi-card">
                        <Statistic
                            title="Activity Count"
                            value={activityCount}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Daily Utilization Chart */}
            <Card title="Daily Utilization" bordered={false}>
                <div style={{ height: 300, width: "100%" }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.45)" fontSize={12} />
                            <YAxis stroke="rgba(255,255,255,0.45)" fontSize={12} />
                            <RechartsTooltip
                                contentStyle={{ backgroundColor: "#141414", border: "1px solid #303030" }}
                                itemStyle={{ fontSize: 12 }}
                            />
                            <Legend />
                            <Bar dataKey="activeHours" name="Active Hours" stackId="a" fill="#52c41a" />
                            <Bar dataKey="idleHours" name="Idle Hours" stackId="a" fill="#d9d9d9" opacity={0.3} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Activity Timeline */}
            <Card title="Activity Timeline" bordered={false}>
                <div style={{ display: 'flex', width: '100%', height: 40, borderRadius: 4, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    {sessions.map((session, idx) => (
                        <Tooltip
                            key={idx}
                            title={`${session.isMoving ? 'Moving' : 'Idle'} · ${formatDuration(session.duration)} · Orientation: ${session.orientation}`}
                        >
                            <div style={{
                                width: `${(session.duration / totalDuration) * 100}%`,
                                backgroundColor: session.isMoving ? '#52c41a' : '#595959',
                                height: '100%',
                                cursor: 'pointer',
                                transition: 'opacity 0.2s',
                            }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                            />
                        </Tooltip>
                    ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(sessions[0].start).format("MMM DD, HH:mm")}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(sessions[sessions.length - 1].end).format("MMM DD, HH:mm")}</Text>
                </div>
            </Card>

            {/* Sessions Table */}
            <Card title="Activity Sessions" bordered={false}>
                <Table
                    dataSource={sessions}
                    columns={columns}
                    rowKey={(record, index) => `${record.start}-${index}`}
                    pagination={{ pageSize: 20 }}
                    size="small"
                />
            </Card>

            {/* Shift Analysis */}
            <Card title="Shift Efficiency" bordered={false}>
                <Row gutter={32}>
                    {shiftData.map(data => (
                        <Col span={8} key={data.shift}>
                            <div style={{ textAlign: 'center' }}>
                                <Text strong style={{ display: 'block', marginBottom: 16, textTransform: 'capitalize' }}>
                                    {data.shift} Shift
                                </Text>
                                <Progress
                                    type="circle"
                                    percent={data.utilization}
                                    strokeColor={getUtilizationColor(data.utilization)}
                                    format={(percent) => (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <span style={{ fontSize: 20 }}>{percent}%</span>
                                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>{formatDuration(data.activeDuration)} active</span>
                                        </div>
                                    )}
                                    width={120}
                                />
                            </div>
                        </Col>
                    ))}
                </Row>
            </Card>
        </div>
    );
};
