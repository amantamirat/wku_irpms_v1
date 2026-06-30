import { useAuth } from "@/contexts/auth-context";
import { TabPanel, TabView } from "primereact/tabview";
import { useMemo } from "react";
import { ProjectApplication } from "../models/project.application.model";
import ReviewerManager from "@/app/(main)/reviewers/components/ReviewerManager";

interface ProjectStageDetailProps {
    projectApplication: ProjectApplication;
    hideReviewer?: boolean;
}

const ProjectStageDetail = ({ projectApplication, hideReviewer }: ProjectStageDetailProps) => {

    const { hasPermission } = useAuth();

    /**
     * Define tabs in a scalable configuration array
     */
    const tabs = useMemo(() => [
        {
            header: "Reviewers",
            permission: "reviewer:read",
            content: <ReviewerManager projectApplication={projectApplication} hideReviewer={hideReviewer} />
        },

    ], [projectApplication]);

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

