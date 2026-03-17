import { useAuth } from "@/contexts/auth-context";
import { PERMISSIONS } from "@/types/permissions";
import { TabPanel, TabView } from "primereact/tabview";
import { useMemo } from "react";
import ProjectManager from "../../projects/components/ProjectManager";
import { Call } from "../models/call.model";
import StageManager from "../stages/components/StageManager";


interface CallDetailProps {
    call: Call;
}

const CallDetail = ({ call }: CallDetailProps) => {

    const { hasPermission } = useAuth();

    /**
     * Define tabs in a scalable configuration array
     */
    const tabs = useMemo(() => [
        {
            header: "Stages",
            permission: PERMISSIONS.STAGE.READ,
            content: <StageManager call={call} />
        },
        {
            header: "Projects",
            permission: PERMISSIONS.PROJECT.READ,
            content: <ProjectManager grant={call} />
        }
    ], [call]);

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

export default CallDetail;

