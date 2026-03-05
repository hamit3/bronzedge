import React from "react";
import { List } from "@refinedev/antd";
import { Typography } from "antd";

export const SettingsPage: React.FC = () => {
    return (
        <List title="General Settings">
            <Typography.Text>Configure your dashboard and system preferences.</Typography.Text>
        </List>
    );
};
