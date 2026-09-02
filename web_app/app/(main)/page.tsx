'use client';

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { PERMISSIONS } from "@/types/permissions";
import { ProgressSpinner } from "primereact/progressspinner";

import CallOpportunityGrid from "./dashboard/CallOpportunityGrid";
import QuickLinks from "./dashboard/QuickLinks";
import UpcomingVerifications from "./dashboard/UpcomingVerifications";
import PendingEvalsManager from "./dashboard/pending-evals/Manager";
import PendingCollabManager from "./dashboard/pending-collabs/Manager";

import { ReviewerApi } from "./reviewers/api/reviewer.api";
import { Reviewer, ReviewerStatus } from "./reviewers/models/reviewer.model";
import { CollaboratorApi } from "./collaborators/api/collaborator.api";
import { Collaborator, CollaboratorStatus } from "./collaborators/models/collaborator.model";
import { ReportDashboard } from "./reports/components/Dashboard";

const Dashboard = () => {
    const { hasPermission } = useAuth();
    const isAdmin = hasPermission([PERMISSIONS.REPORT.OVERVIEW]);
    // const isReviewer = hasPermission([PERMISSIONS.REVIEWER.READ]);
    //const isResearcher = hasPermission([PERMISSIONS.PROJECT.READ]);
    const isApplicant = hasPermission("application:apply");

    const [loadingEvals, setLoadingEvals] = useState(true);
    const [loadingCollabs, setLoadingCollabs] = useState(true);

    const [pendingReviewees, setPendingReviewees] = useState<Reviewer[] | undefined>(undefined);
    const [pendingCollabs, setPendingCollabs] = useState<Collaborator[] | undefined>(undefined);

    useEffect(() => {
        // Fetch Pending Evaluations
        const fetchPendingEvals = async () => {
            setLoadingEvals(true);
            try {
                const data = await ReviewerApi.me({ status: ReviewerStatus.pending });
                setPendingReviewees(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching pending reviewers", error);
            } finally {
                setLoadingEvals(false);
            }
        };

        // Fetch Pending Collaborations
        const fetchCollabs = async () => {
            setLoadingCollabs(true);
            try {
                const data = await CollaboratorApi.me({ status: CollaboratorStatus.pending });
                setPendingCollabs(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching pending collaborations", error);
            } finally {
                setLoadingCollabs(false);
            }
        };

        fetchPendingEvals();
        fetchCollabs();
    }, []);

    return (
        <div className="grid">
            {/* 📊 REPORT OVERVIEW / STATS ROW */}
            {isAdmin && (
                <div className="col-12 mb-2">
                    <ReportDashboard />
                </div>
            )}

            {/* 🔵 LEFT COLUMN: Core Work */}
            <div className="col-12 lg:col-8">

                {/* 1. Collaboration Invitations */}
                {(loadingCollabs || (pendingCollabs && pendingCollabs.length > 0)) && (
                    <div className="card border-none shadow-1 p-4 mb-4">
                        {loadingCollabs ? (
                            <div className="flex flex-column align-items-center justify-content-center p-4">
                                <ProgressSpinner style={{ width: '35px', height: '35px' }} strokeWidth="4" />
                                <span className="mt-2 text-500 text-sm font-medium">Loading pending collaborations...</span>
                            </div>
                        ) : (
                            <PendingCollabManager items={pendingCollabs!} />
                        )}
                    </div>
                )}

                {/* 2. Reviewer Tasks */}
                {(loadingEvals || (pendingReviewees && pendingReviewees.length > 0)) && (
                    <div className="card border-none shadow-1 p-4 mb-4">
                        {loadingEvals ? (
                            <div className="flex flex-column align-items-center justify-content-center p-4">
                                <ProgressSpinner style={{ width: '35px', height: '35px' }} strokeWidth="4" />
                                <span className="mt-2 text-500 text-sm font-medium">Loading pending evaluations...</span>
                            </div>
                        ) : (
                            <PendingEvalsManager items={pendingReviewees!} />
                        )}
                    </div>
                )}

                {/* 3. Call Opportunities */}
                {isApplicant && (
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
                <div className="card border-none shadow-1 p-4 mb-4">
                    <h5 className="m-0 text-xl font-bold mb-3">Upcoming Verifications</h5>
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