import { useAuth } from "@/contexts/auth-context";
import { TabPanel, TabView } from "primereact/tabview";
import { useMemo } from "react";
import { Application } from "../models/application.model";
import ReviewerManager from "../../reviewers/application/Manager";
import ProjectDetail from "../../projects/components/ProjectDetail";

interface ApplicationDetailProps {
    application: Application;
}

const ApplicationDetail = ({ application }: ApplicationDetailProps) => {

    const { hasPermission } = useAuth();

    // Safely extract project ID whether application.project is an object or string ID
    const projectId = typeof application?.project === "object" && application.project !== null
        ? application.project._id
        : (application?.project as string);

    /**
     * Define tabs in a scalable configuration array
     */
    const tabs = useMemo(() => [
        {
            header: "Reviewers",
            permission: "reviewer:read",
            content: <ReviewerManager application={application} />
        },
        {
            header: "Project",
            permission: "project:read",
            content: projectId ? <ProjectDetail project={projectId} /> : null
        },
    ], [application, projectId]);

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

export default ApplicationDetail;