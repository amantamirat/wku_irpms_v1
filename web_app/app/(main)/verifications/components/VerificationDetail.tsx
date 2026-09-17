import { useAuth } from "@/contexts/auth-context";
import { TabPanel, TabView } from "primereact/tabview";
import { useMemo } from "react";
import ProjectDetail from "../../projects/components/ProjectDetail";
import VerificationReviewerManager from "../../reviewers/verification/Manager";
import { Verification } from "../models/verification.model";

interface VerificationDetailProps {
    verification: Verification;
}

const VrificationDetail = ({ verification: verfication }: VerificationDetailProps) => {

    const { hasPermission } = useAuth();

    // Safely extract project ID whether application.project is an object or string ID
    const projectId = typeof verfication?.project === "object" && verfication.project !== null
        ? verfication.project._id
        : (verfication?.project as string);

    /**
     * Define tabs in a scalable configuration array
     */
    const tabs = useMemo(() => [
        {
            header: "Reviewers",
            permission: "reviewer:read",
            content: <VerificationReviewerManager verification={verfication} />
        },
        {
            header: "Project",
            permission: "project:read",
            content: projectId ? <ProjectDetail project={projectId} /> : null
        },
    ], [verfication, projectId]);

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

export default VrificationDetail;