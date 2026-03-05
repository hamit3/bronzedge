import React from "react";
import { List } from "@refinedev/antd";
import { Typography } from "antd";

export const ReportList: React.FC = () => {
    return (
        <List title="Industrial Reports">
            <Typography.Text>Weekly and monthly diagnostic reports.</Typography.Text>
        </List>
    );
};
