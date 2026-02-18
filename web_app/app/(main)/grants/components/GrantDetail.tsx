import { useAuth } from "@/contexts/auth-context";
import { Grant } from "../models/grant.model";
import { useMemo } from "react";
import { PERMISSIONS } from "@/types/permissions";
import ConstraintManager from "../constraints/components/ConstraintManager";

import CompositionManager from "../compositions/components/CompositionManager";
import { TabPanel, TabView } from "primereact/tabview";


interface GrantDetailProps {
    grant: Grant;
}

const GrantDetail = ({ grant }: GrantDetailProps) => {

    const { hasPermission } = useAuth();

    /**
     * Define tabs in a scalable configuration array
     */
    const tabs = useMemo(() => [
        {
            header: "Constraints",
            permission: PERMISSIONS.CONSTRAINT.READ,
            content: <ConstraintManager grant={grant} />
        },
        {
            header: "Compositions",
            permission: PERMISSIONS.CONSTRAINT.READ,
            content: <CompositionManager grant={grant} />
        }
    ], [grant]);

    /**
     * Filter tabs based on permissions
     */
    const allowedTabs = tabs.filter(tab =>
        hasPermission([tab.permission])
    );

    return (
        <TabView>
            {allowedTabs.map((tab, index) => (
                <TabPanel key={index} header={tab.header}>
                    {tab.content}
                </TabPanel>
            ))}
        </TabView>
    );
};

export default GrantDetail;

