import React from "react";
import { Result, Button, Typography } from "antd";
import { useNavigate } from "react-router";

const { Text } = Typography;

export const ErrorPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0d1223",
            color: "white"
        }}>
            <Result
                status="404"
                title={<span style={{ color: "white" }}>404</span>}
                subTitle={<Text style={{ color: "rgba(255,255,255,0.65)" }}>Sorry, the page you visited does not exist within the BronzEdge ecosystem.</Text>}
                extra={
                    <Button
                        type="primary"
                        onClick={() => navigate("/devices")}
                        style={{ height: '40px', padding: '0 32px' }}
                    >
                        Back to Devices
                    </Button>
                }
            />
        </div>
    );
};
