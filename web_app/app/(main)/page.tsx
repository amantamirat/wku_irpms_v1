'use client';

import { useAuth } from "@/contexts/auth-context";
import { PERMISSIONS } from "@/types/permissions";
import CallOpportunityGrid from "./dashboard/CallOpportunityGrid";
import DeadlineCalendar from "./dashboard/DeadlineCalendar";
import QuickLinks from "./dashboard/QuickLinks";
import PendingEvaluations from "./dashboard/PendingEvaluation";
import PendingCollaborations from "./dashboard/PendingCollaborations";
import UpcomingVerifications from "./dashboard/UpcomingVerifications";


const Dashboard = () => {
    const { hasPermission, getUser } = useAuth();
    const currentUser = getUser();

    const isAdmin = hasPermission([PERMISSIONS.PERMISSION.READ]);
    const isReviewer = hasPermission([PERMISSIONS.REVIEWER.READ]);
    const isResearcher = hasPermission([PERMISSIONS.PROJECT.READ]);

    return (
        <div className="grid">
            <div className="col-12">
                {/* Stats row can go here */}
            </div>

            {/* 🔵 LEFT COLUMN: Core Work */}
            <div className="col-12 lg:col-8">

                {/* 1. Collaboration Invitations (High Priority for Researchers) */}
                {
                    (isResearcher && currentUser) && (
                        <PendingCollaborations user={currentUser} />
                    )
                }

                {/* 2. Reviewer Tasks */}
                {(isReviewer && currentUser) && (
                    <PendingEvaluations user={currentUser} />
                )}

                {/* 3. Call Opportunities */}
                {isResearcher && (
                    <div className="card border-none shadow-1 p-4 mb-4">
                        <div className="flex align-items-center justify-content-between mb-4">
                            <h5 className="m-0 text-xl font-bold">Call Opportunities</h5>
                        </div>
                        <CallOpportunityGrid />
                    </div>
                )}
            </div>

            {/* 🟠 RIGHT COLUMN: Utilities */}
            <div className="col-12 lg:col-4">
                <div className="card">
                    <h5>Upcoming Verfications</h5>
                    <UpcomingVerifications />
                </div>
            </div>

            <div className="col-12">
                <QuickLinks />
            </div>
        </div>
    );
};

export default Dashboard;