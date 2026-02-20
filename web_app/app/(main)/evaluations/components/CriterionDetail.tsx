import { useAuth } from "@/contexts/auth-context";
import { Criterion } from "../models/criterion.model";
import { useMemo } from "react";
import { PERMISSIONS } from "@/types/permissions";
import { TabPanel, TabView } from "primereact/tabview";
import CriterionManager from "./CriterionManager";
import OptionManager from "./OptionManager";

interface CriterionDetailProps {
    criterion: Criterion;
}

const CriterionDetail = ({ criterion }: CriterionDetailProps) => {

    const { hasPermission } = useAuth();

    /**
     * Define tabs in a scalable configuration array
     */
    const tabs = useMemo(() => [
        {
            header: "Options",
            permission: PERMISSIONS.OPTION.READ,
            content: <OptionManager criterion={criterion} />
        }
    ], [criterion]);

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

export default CriterionDetail;

