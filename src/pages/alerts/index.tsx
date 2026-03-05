import React from "react";
import { List } from "@refinedev/antd";
import { Typography } from "antd";

export const AlertList: React.FC = () => {
    return (
        <List title="System Alerts">
            <Typography.Text>Critical alerts and system notifications.</Typography.Text>
        </List>
    );
};
