import { StatusHistoryWidget } from "@/components/StatusHistoryWidget";
import { useAuth } from "@/contexts/auth-context";
import { TabPanel, TabView } from "primereact/tabview";
import { useMemo } from "react";
import ProjectDetail from "../../projects/components/ProjectDetail";
import { Project } from "../../projects/models/project.model";
import ReviewerManager from "../../reviewers/components/ReviewerManager";
import { ReviewerTargetType } from "../../reviewers/models/reviewer.model";
import { Application } from "../models/application.model";

interface ApplicationDetailProps {
    application: Application;
    updateApplication?: (application: Application) => void;
}

const ApplicationDetail = ({ application, updateApplication }: ApplicationDetailProps) => {

    const { hasPermission } = useAuth();

    // Safely extract project ID whether application.project is an object or string ID
    const projectData = application.project;
    /**
     * Define tabs in a scalable configuration array
     */
    const tabs = useMemo(() => [
        {
            header: "Project",
            permission: "project:lookup",
            content: <ProjectDetail project={projectData as Project} disableCrud={true} />
        },
        {
            header: "Reviewers",
            permission: "reviewer:lookup",
            content: <ReviewerManager targetType={ReviewerTargetType.APPLICATION} application={application}
                updateApplication={updateApplication} />
        },
        {
            header: "Status History",
            icon: "pi pi-history",
            permission: "application:read",
            content: <StatusHistoryWidget history={application.statusHistory} />
        }
    ], [application, projectData]);

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