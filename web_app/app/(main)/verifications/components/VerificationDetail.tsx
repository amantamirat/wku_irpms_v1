import { useAuth } from "@/contexts/auth-context";
import { TabPanel, TabView } from "primereact/tabview";
import { useMemo } from "react";
import ProjectDetail from "../../projects/components/ProjectDetail";
import ReviewerManager from "../../reviewers/components/ReviewerManager";
import { ReviewerTargetType } from "../../reviewers/models/reviewer.model";
import { Verification } from "../models/verification.model";
import { Project } from "../../projects/models/project.model";

interface VerificationDetailProps {
    verification: Verification;
}

const VrificationDetail = ({ verification: verfication }: VerificationDetailProps) => {

    const { hasPermission } = useAuth();

    

    /**
     * Define tabs in a scalable configuration array
     */
    const tabs = useMemo(() => [
        {
            header: "Project",
            permission: "project:read",
            content:  <ProjectDetail project={verfication?.project as Project} />
        },
        {
            header: "Reviewers",
            permission: "reviewer:read",
            content: <ReviewerManager targetType={ReviewerTargetType.VERIFICATION} verification={verfication} />
        },
    ], [verfication, verfication?.project]);

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