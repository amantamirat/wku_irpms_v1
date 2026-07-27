import { useAuth } from "@/contexts/auth-context";
import { useMemo } from "react";
import { PERMISSIONS } from "@/types/permissions";
import { TabPanel, TabView } from "primereact/tabview";
import { Stage } from "../models/stage.model";
import ApplicationManager from "@/app/(main)/projects/applications/components/ApplicationManager";


interface StageDetailProps {
    stage: Stage;
}

const StageDetail = ({ stage }: StageDetailProps) => {

    const { hasPermission } = useAuth();
    /**
     * Define tabs in a scalable configuration array
     */
    const tabs = useMemo(() => [
        {
            header: "Applications",
            permission: PERMISSIONS.DOCUMENT.READ,
            content: <ApplicationManager stage={stage} />
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

