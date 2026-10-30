'use client';

import { SpinnerSkeleton } from '@/components/Skeletons';
import { useAuth } from "@/contexts/auth-context";
import CollaboratorManager from "../../projects/collaborators/components/CollaboratorManager";
import { User } from "../../users/models/user.model";

export const MY_COLLABORATIONS_PAGE_LINK = "/dashboard/my-collaborations"

const Page = () => {
    const { getUser, loading } = useAuth();
    const me = getUser();

    // Show loading skeleton while user session hydrates
    if (loading) {
        return (
            <SpinnerSkeleton text='loading current user' />
        );
    }

    return (
        <div className="p-4 md:p-6 surface-ground min-h-screen">
            {/* HEADER SECTION */}
            <div className="surface-card p-4 md:p-5 border-round-xl shadow-1 mb-4 flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3">
                <div>
                    <div className="flex align-items-center gap-2 mb-2">
                        <i className="pi pi-briefcase text-primary text-2xl" />
                        <h5 className="font-bold text-900 m-0">
                            My Project Collaborations
                        </h5>
                    </div>
                    <p className="text-600 text-sm md:text-base m-0 line-height-3">
                        View, manage, and track all your project collaborations, research team memberships, and co-investigator roles across institutional projects.
                    </p>
                </div>
            </div>

            {/* MAIN CONTENT TABLE CONTAINER */}
            <div className="surface-card border-round-xl shadow-1 p-3 md:p-4">
                <CollaboratorManager
                    useLookup
                    disableCrud={true}
                    member={me as User}
                    enableProjectDetail
                />
            </div>
        </div>
    );
};

export default Page;