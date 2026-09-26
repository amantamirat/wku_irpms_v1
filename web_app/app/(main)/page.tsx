'use client';

import { useAuth } from "@/contexts/auth-context";
import { PERMISSIONS } from "@/types/permissions";
import { ProgressSpinner } from "primereact/progressspinner";
import { useEffect, useState } from "react";

import { CollaboratorApi } from "./collaborators/api/collaborator.api";
import { Collaborator, CollaboratorStatus } from "./collaborators/models/collaborator.model";
import AvailableStages from "./dashboard/AvailableStages";
import CallOpportunityGrid from "./dashboard/CallOpportunityGrid";
import QuickLinks from "./dashboard/QuickLinks";
import VerificationWindow from "./dashboard/VerificationWindow";
import MyPendingInvitations from "./dashboard/pending-invitations/MyPendingInvitations";
import MyPendingEvaluations from "./dashboard/pending-evaluations/MyPendingEvaluations";
import { ReportDashboard } from "./reports/components/Dashboard";
import { ReviewerApi } from "./reviewers/api/reviewer.api";
import { Reviewer, ReviewerStatus } from "./reviewers/models/reviewer.model";
import { Application, ApplicationStatus } from "./applications/models/application.model";
import { ApplicationApi } from "./applications/api/application.api";
import PendingApplications from "./dashboard/pending-applications/PendingApplications";

const Dashboard = () => {
    const { hasPermission } = useAuth();
    const isAdmin = hasPermission([PERMISSIONS.REPORT.OVERVIEW]);
    const canLookCalls = hasPermission("call:lookup");
    const canLookVerificationConfs = hasPermission("verification-conf:lookup");
    const canLookStages = hasPermission("stage:lookup");
    const canReadAssignedApplications = hasPermission("application:assigned:read");

    const [loadingEvals, setLoadingEvals] = useState(true);
    const [loadingCollabs, setLoadingCollabs] = useState(true);
    const [loadingAppls, setLoadingAppls] = useState(true);

    const [pendingReviewees, setPendingReviewees] = useState<Reviewer[] | undefined>(undefined);
    const [pendingCollaborations, setPendingCollaborations] = useState<Collaborator[] | undefined>(undefined);
    const [shortApplications, setShortApplications] = useState<Application[] | undefined>(undefined);

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
        const fetchCollabInvitation = async () => {
            setLoadingCollabs(true);
            try {
                const data = await CollaboratorApi.me({ status: CollaboratorStatus.pending });
                setPendingCollaborations(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching pending collaborations", error);
            } finally {
                setLoadingCollabs(false);
            }
        };

        // Fetch assigned application
        const fetchShortlistedApplications = async () => {
            setLoadingAppls(true);
            try {
                const data = await ApplicationApi.getMyAssignedApplications({ status: ApplicationStatus.shortlisted });
                setShortApplications(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching shortlisted applications", error);
            } finally {
                setLoadingAppls(false);
            }
        };

        fetchPendingEvals();
        fetchCollabInvitation();
        if (canReadAssignedApplications) {
            fetchShortlistedApplications();
        }

    }, [canReadAssignedApplications]);

    // Check if the left section has any active content (loading states or data)
    const hasLeftContent =
        loadingEvals ||
        loadingCollabs ||
        loadingAppls ||
        (pendingCollaborations && pendingCollaborations.length > 0) ||
        (pendingReviewees && pendingReviewees.length > 0) ||
        (shortApplications && shortApplications.length > 0) ||
        canReadAssignedApplications ||
        canLookCalls;

    return (
        <div className="grid">
            {/* 📊 REPORT OVERVIEW / STATS ROW */}
            {isAdmin && (
                <div className="col-12 mb-2">
                    <ReportDashboard />
                </div>
            )}

            {/* 🔵 LEFT COLUMN: Core Work (Only rendered if there's content to display) */}
            {hasLeftContent && (
                <div className="col-12 lg:col-8">

                    {/* 1. Collaboration Invitations */}
                    {(loadingCollabs || (pendingCollaborations && pendingCollaborations.length > 0)) && (
                        <div className="card border-none shadow-1 p-4 mb-4">
                            {loadingCollabs ? (
                                <div className="flex flex-column align-items-center justify-content-center p-4">
                                    <ProgressSpinner style={{ width: '35px', height: '35px' }} strokeWidth="4" />
                                    <span className="mt-2 text-500 text-sm font-medium">Loading pending collaborations...</span>
                                </div>
                            ) : (
                                <MyPendingInvitations items={pendingCollaborations!} />
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
                                <MyPendingEvaluations items={pendingReviewees!} />
                            )}
                        </div>
                    )}

                    {/* 3. Pending Shortlisted/Assigned Applications */}
                    {canReadAssignedApplications && (loadingAppls || (shortApplications && shortApplications.length > 0)) && (
                        <div className="card border-none shadow-1 p-4 mb-4">
                            {loadingAppls ? (
                                <div className="flex flex-column align-items-center justify-content-center p-4">
                                    <ProgressSpinner style={{ width: '35px', height: '35px' }} strokeWidth="4" />
                                    <span className="mt-2 text-500 text-sm font-medium">Loading pending applications...</span>
                                </div>
                            ) : (
                                <PendingApplications items={shortApplications!} />
                            )}
                        </div>
                    )}

                    {/* 4. Call Opportunities */}
                    {canLookCalls && (
                        <div className="card border-none shadow-1 p-4 mb-4">
                            <div className="flex align-items-center justify-content-between mb-4">
                                <h5 className="m-0 text-xl font-bold">Call Opportunities</h5>
                            </div>
                            <CallOpportunityGrid />
                        </div>
                    )}

                    {/* 🔗 QUICK LINKS (Moved inside left column to avoid spacing gaps) */}
                    <div className="mt-4">
                        <QuickLinks />
                    </div>
                </div>
            )}

            {/* 🟠 RIGHT COLUMN: Expands to full width (lg:col-12) if left column is absent */}
            <div className={`col-12 ${hasLeftContent ? 'lg:col-4' : 'lg:col-12'}`}>
                <div className="grid">

                    {/* Available Deadlines Widget */}
                    {canLookStages && (
                        <div className={`col-12 ${!hasLeftContent ? 'md:col-6' : ''}`}>
                            <AvailableStages />
                        </div>
                    )}

                    {/* Verification Deadlines Widget */}
                    {canLookVerificationConfs && (
                        <div className={`col-12 ${!hasLeftContent ? 'md:col-6' : ''}`}>
                            <VerificationWindow />
                        </div>
                    )}

                </div>
            </div>

            {/* Fallback QuickLinks if left column isn't rendered */}
            {!hasLeftContent && (
                <div className="col-12">
                    <QuickLinks />
                </div>
            )}
        </div>
    );
};

export default Dashboard;