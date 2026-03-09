import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "bronzedge_active_org_id";

interface OrganizationContextType {
    activeOrgId: string | undefined;
    setActiveOrgId: (id: string) => void;
    clearActiveOrg: () => void;
}

const OrganizationContext = createContext<OrganizationContextType>({
    activeOrgId: undefined,
    setActiveOrgId: () => { },
    clearActiveOrg: () => { },
});

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [activeOrgId, setActiveOrgIdState] = useState<string | undefined>(() => {
        try {
            return localStorage.getItem(STORAGE_KEY) ?? undefined;
        } catch {
            return undefined;
        }
    });

    const setActiveOrgId = useCallback((id: string) => {
        setActiveOrgIdState(id);
        try {
            localStorage.setItem(STORAGE_KEY, id);
        } catch { }
    }, []);

    const clearActiveOrg = useCallback(() => {
        setActiveOrgIdState(undefined);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch { }
    }, []);

    return (
        <OrganizationContext.Provider
            value={{ activeOrgId, setActiveOrgId, clearActiveOrg }}
        >
            {children}
        </OrganizationContext.Provider>
    );
};

export const useOrganization = () => useContext(OrganizationContext);
