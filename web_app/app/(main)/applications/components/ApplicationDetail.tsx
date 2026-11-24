import { StatusHistoryWidget } from "@/components/StatusHistoryWidget";
import { useAuth } from "@/contexts/auth-context";
import { TabPanel, TabView } from "primereact/tabview";
import { useMemo } from "react";
import ProjectDetail from "../../projects/components/ProjectDetail";
import { Project } from "../../projects/models/project.model";
import ReviewerManager from "../../reviewers/components/ReviewerManager";
import { ReviewerTargetType } from "../../reviewers/models/reviewer.model";
import { Application } from "../models/application.model";
import ResultViewer from "../../reviewers/results/components/ResultViewer";

interface ApplicationDetailProps {
    application: Application;
    updateApplication?: (application: Application) => void;
    enableDetail?: boolean;
}

const ApplicationDetail = ({ application, updateApplication, enableDetail = false }: ApplicationDetailProps) => {

    const { hasPermission } = useAuth();

    const projectData = application.project;

    /**
     * Define tabs in a scalable configuration array.
     * `detailOnly` tabs are shown only when enableDetail is true.
     */
    const tabs = useMemo(() => [
        {
            header: "Project",
            permission: "project:read",
            detailOnly: true,
            content: <ProjectDetail project={projectData as Project} options={{ disableCrud: true }} />
        },
        {
            header: "Reviewers",
            permission: "reviewer:read",
            detailOnly: true,
            content: <ReviewerManager targetType={ReviewerTargetType.APPLICATION} application={application}
                updateApplication={updateApplication} />
        },
        {
            header: "Results",
            permission: "result:read",
            content: <ResultViewer application={application._id} />
        },
        {
            header: "Status History",
            icon: "pi pi-history",
            permission: "application:lookup",
            content: <StatusHistoryWidget history={application.statusHistory} />
        }
    ], [application, projectData, updateApplication]);

    /**
     * Filter tabs based on detail mode and permissions
     */
    const allowedTabs = tabs.filter(tab =>
        (enableDetail || !tab.detailOnly) &&
        hasPermission([tab.permission])
    );

    return (
        <TabView>
            {allowedTabs.map((tab) => (
                <TabPanel key={tab.header} header={tab.header}>
                    {tab.content}
                </TabPanel>
            ))}
        </TabView>
    );
};

export default ApplicationDetail;