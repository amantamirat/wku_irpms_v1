import { useAuth } from "@/contexts/auth-context";
import { useMemo } from "react";
import { PERMISSIONS } from "@/types/permissions";
import { TabPanel, TabView } from "primereact/tabview";

import ProjectDocManager from "@/app/(main)/projects/documents/components/ProjectDocManager";
import { CallStage } from "../models/stage.model";


interface StageDetailProps {
    stage: CallStage;
}

const StageDetail = ({ stage }: StageDetailProps) => {

    const { hasPermission } = useAuth();
    /**
     * Define tabs in a scalable configuration array
     */
    const tabs = useMemo(() => [
        {
            header: "Documents",
            permission: PERMISSIONS.DOCUMENT.READ,
            content: <ProjectDocManager stage={stage} />
        }
    ], [stage]);

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

export default StageDetail;

