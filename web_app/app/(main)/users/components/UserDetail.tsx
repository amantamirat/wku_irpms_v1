import { TabPanel, TabView } from "primereact/tabview";
import { useMemo } from "react";

import CollaboratorManager from "../../projects/collaborators/components/CollaboratorManager";
import ReviewerManager from "../../reviewers/components/ReviewerManager";
import SpecializationManager from "../../specializations/components/SpecializationManager";
import ExperienceManager from "../experiences/components/ExperienceManager";
import StudentManager from "../students/components/StudentManager";
import PublicationManager from "../publications/components/PublicationManager";

import { User } from "../models/user.model";
import { PERMISSIONS } from "@/types/permissions";
import { useAuth } from "@/contexts/auth-context";

interface UserDetailProps {
    user: User;
}

const UserDetail = ({ user: user }: UserDetailProps) => {

    const { hasPermission } = useAuth();

    /**
     * Define tabs in a scalable configuration array
     */
    const tabs = useMemo(() => [
        {
            header: "Collaborations",
            permission: PERMISSIONS.COLLABORATOR.READ,
            content: <CollaboratorManager applicant={user} />
        },
        {
            header: "Evaluations",
            permission: PERMISSIONS.REVIEWER.READ,
            content: <ReviewerManager applicant={user} />
        },
        {
            header: "Experiences",
            permission: PERMISSIONS.EXPERIENCE.READ,
            content: <ExperienceManager applicant={user} />
        },
        {
            header: "Publications",
            permission: PERMISSIONS.PUBLICATION.READ,
            content: <PublicationManager author={user} />
        },
        {
            header: "Enrollments",
            permission: PERMISSIONS.STUDENT.READ,
            content: <StudentManager applicant={user} />
        }
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

