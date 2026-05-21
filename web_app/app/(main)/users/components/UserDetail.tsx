import { useAuth } from "@/contexts/auth-context";
import { PERMISSIONS } from "@/types/permissions";
import { TabPanel, TabView } from "primereact/tabview";
import { useMemo } from "react";

import { User } from "../models/user.model";

import EnrollmentManager from "../enrollments/components/EnrollmentManager";
import ExperienceManager from "../experiences/components/ExperienceManager";
import PublicationManager from "../publications/components/PublicationManager";

interface UserDetailProps {
    user: User;
}

const UserDetail = ({ user }: UserDetailProps) => {

    const { hasPermission } = useAuth();

    /**
     * Define tabs in scalable configuration
     */
    const tabs = useMemo(() => [
        {
            header: "Experiences",
            permission: PERMISSIONS.EXPERIENCE.READ,
            content: <ExperienceManager user={user} />
        },

        {
            header: "Publications",
            permission: PERMISSIONS.PUBLICATION.READ,
            content: <PublicationManager author={user} />
        },

        {
            header: "Enrollments",
            permission: "enrollment:read",
            content: <EnrollmentManager student={user} />
        },

        /*
        {
            header: "Evaluations",
            permission: PERMISSIONS.REVIEWER.READ,
            content: <ReviewerManager applicant={user} />
        }
        */
    ], [user]);

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

export default UserDetail;