import { useAuth } from "@/contexts/auth-context";
import { TabPanel, TabView } from "primereact/tabview";
import { useMemo } from "react";
import { Call } from "../models/call.model";
import StageManager from "../stages/components/StageManager";
import ProjectManager from "../../projects/components/ProjectManager";
import { PERMISSIONS } from "@/types/permissions";


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
            permission: "call.stage:read",
            content: <StageManager call={call} />
        },


        {
            header: "Projects",
            permission: PERMISSIONS.PROJECT.READ,
            disabled: true,
            content: <ProjectManager call={call} />
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
                <TabPanel key={index} header={tab.header} disabled={tab.disabled}>
                    {tab.content}
                </TabPanel>
            ))}
        </TabView>
    );
};

export default CallDetail;

