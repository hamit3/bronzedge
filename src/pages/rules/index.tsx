import React from "react";
import { Card } from "antd";
import { RulesTab } from "./RulesTab";
import { useOrganization } from "../../contexts/organization";
import { PageHeader } from "../../components/PageHeader";

export const RulesPage = () => {
    const { activeOrgId } = useOrganization();

    return (
        <div style={{ padding: "24px", minHeight: "100vh" }}>
            <PageHeader 
                title="Rules Engine" 
                subtitle={`Configure automation and alert triggers — ${new Date().toLocaleString('tr-TR')}`} 
            />
            <Card variant="borderless" className="shadow-premium">
                <RulesTab key={activeOrgId} />
            </Card>
        </div>
    );
};
