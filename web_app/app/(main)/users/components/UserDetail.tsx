import React, { useMemo } from "react";
import { TabPanel, TabView } from "primereact/tabview";
import { useAuth } from "@/contexts/auth-context";
import { PERMISSIONS } from "@/types/permissions";
import { User } from "../models/user.model";
import CollaboratorManager from "../../projects/collaborators/components/CollaboratorManager";
import StudentManager from "../students/components/StudentManager";
import PublicationManager from "../publications/components/PublicationManager";
import ExperienceManager from "../experiences/components/ExperienceManager";
import ReviewerManager from "../../reviewers/components/ReviewerManager";

// Suggestion: Lazy load these if they are heavy
// const ExperienceManager = React.lazy(() => import("../experiences/components/ExperienceManager"));

interface UserDetailProps {
    user: User;
}

const UserDetail: React.FC<UserDetailProps> = ({ user }) => {
    const { hasPermission } = useAuth();

    const tabs = useMemo(() => [
        /*{
            header: "Collaborations",
            permission: PERMISSIONS.COLLABORATOR.READ,
            content: <CollaboratorManager applicant={user} />
        },*/
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
            permission: PERMISSIONS.STUDENT.READ,
            content: <StudentManager applicant={user} />
        },
        /*
        {

            header: "Evaluations",
            permission: PERMISSIONS.REVIEWER.READ,
            content: <ReviewerManager applicant={user} />
        },*/
    ], [user]);

    const allowedTabs = useMemo(() =>
        tabs.filter(tab => hasPermission([tab.permission])),
        [tabs, hasPermission]);

    if (allowedTabs.length === 0) {
        return <div className="p-4 text-center text-muted">No details available based on your permissions.</div>;
    }

    return (
        <div className="card shadow-sm border-0">
            <TabView scrollable>
                {allowedTabs.map(({ header, content }, index) => (
                    <TabPanel key={`${header}-${index}`} header={header}>
                        <div className="pt-3">
                            {content}
                        </div>
                    </TabPanel>
                ))}
            </TabView>
        </div>
    );
};

export default UserDetail;