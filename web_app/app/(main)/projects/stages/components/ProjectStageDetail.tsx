import { useAuth } from "@/contexts/auth-context";
import { TabPanel, TabView } from "primereact/tabview";
import { useMemo } from "react";
import { ProjectStage } from "../models/project.stage.model";
import ReviewerManager from "@/app/(main)/reviewers/components/ReviewerManager";

interface ProjectStageDetailProps {
    projectStage: ProjectStage;
}

const ProjectStageDetail = ({ projectStage }: ProjectStageDetailProps) => {

    const { hasPermission } = useAuth();

    /**
     * Define tabs in a scalable configuration array
     */
    const tabs = useMemo(() => [
        {
            header: "Reviewers",
            permission: "reviewer:read",
            content: <ReviewerManager projectStage={projectStage} />
        },

    ], [projectStage]);

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

export default ProjectStageDetail;

