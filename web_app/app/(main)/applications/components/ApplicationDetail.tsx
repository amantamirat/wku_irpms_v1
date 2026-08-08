import { useAuth } from "@/contexts/auth-context";
import { TabPanel, TabView } from "primereact/tabview";
import { useMemo } from "react";
import { Application } from "../models/application.model";
import ReviewerManager from "@/app/(main)/reviewers/components/ReviewerManager";

interface ApplicationDetailProps {
    application: Application;
    hideReviewer?: boolean;
}

const ApplicationDetail = ({ application, hideReviewer }: ApplicationDetailProps) => {

    const { hasPermission } = useAuth();

    /**
     * Define tabs in a scalable configuration array
     */
    const tabs = useMemo(() => [
        {
            header: "Reviewers",
            permission: "reviewer:read",
            content: <ReviewerManager application={application} hideReviewer={hideReviewer} />
        },

    ], [application]);

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

