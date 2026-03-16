import { useAuth } from "@/contexts/auth-context";
import { PERMISSIONS } from "@/types/permissions";
import { TabPanel, TabView } from "primereact/tabview";
import { useMemo } from "react";
import CallManager from "../../calls/components/CallManager";
import CompositionManager from "../compositions/components/CompositionManager";
import ConstraintManager from "../constraints/components/ConstraintManager";
import { Grant } from "../models/grant.model";
import StageManager from "../stages/components/StageManager";


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
        },
        {
            header: "Stages",
            permission: "grant_stage:read",
            content: <StageManager grant={grant} />
        },
        {
            header: "Calls",
            permission: PERMISSIONS.CALL.READ,
            content: <CallManager grant={grant} />
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

