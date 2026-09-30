'use client';

import React, { useState, useEffect } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Badge } from 'primereact/badge';
import { Collaborator, CollaboratorStatus } from '../collaborators/models/collaborator.model';
import { Reviewer, ReviewerStatus } from '../reviewers/models/reviewer.model';
import { Application, ApplicationStatus } from '../applications/models/application.model';
import { CollaboratorApi } from '../collaborators/api/collaborator.api';
import { ReviewerApi } from '../reviewers/api/reviewer.api';
import { ApplicationApi } from '../applications/api/application.api';
import MyPendingInvitations from './pending-invitations/MyPendingInvitations';
import MyPendingEvaluations from './pending-evaluations/MyPendingEvaluations';
import PendingApplications from './pending-applications/PendingApplications';

interface MyPendingWorksProps {
    canReadAssignedApplications: boolean;
}

export const MyPendingWorks: React.FC<MyPendingWorksProps> = ({
    canReadAssignedApplications,
}) => {
    const [pendingCollaborations, setPendingCollaborations] = useState<Collaborator[]>([]);
    const [pendingReviewees, setPendingReviewees] = useState<Reviewer[]>([]);
    const [shortApplications, setShortApplications] = useState<Application[]>([]);

    const [loadingCollabs, setLoadingCollabs] = useState(true);
    const [loadingEvals, setLoadingEvals] = useState(true);
    const [loadingAppls, setLoadingAppls] = useState(true);

    const [activeIndex, setActiveIndex] = useState(0);
    const [hasInitialized, setHasInitialized] = useState(false);

    // Fetch data inside the component
    useEffect(() => {
        const fetchPendingData = async () => {
            // 1. Collaborations
            setLoadingCollabs(true);
            try {
                const data = await CollaboratorApi.me({ status: CollaboratorStatus.pending });
                setPendingCollaborations(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching pending collaborations", error);
            } finally {
                setLoadingCollabs(false);
            }

            // 2. Evaluations
            setLoadingEvals(true);
            try {
                const data = await ReviewerApi.me({ status: ReviewerStatus.pending });
                setPendingReviewees(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching pending reviewers", error);
            } finally {
                setLoadingEvals(false);
            }

            // 3. Applications
            if (canReadAssignedApplications) {
                setLoadingAppls(true);
                try {
                    const data = await ApplicationApi.getMyAssignedApplications({ status: ApplicationStatus.shortlisted });
                    setShortApplications(Array.isArray(data) ? data : []);
                } catch (error) {
                    console.error("Error fetching shortlisted applications", error);
                } finally {
                    setLoadingAppls(false);
                }
            } else {
                setLoadingAppls(false);
            }
        };

        fetchPendingData();
    }, [canReadAssignedApplications]);

    const collabCount = pendingCollaborations.length;
    const evalCount = pendingReviewees.length;
    const applCount = canReadAssignedApplications ? shortApplications.length : 0;

    // Automatically switch to the tab with the highest count once data finishes loading
    useEffect(() => {
        const isFinishedLoading = !loadingCollabs && !loadingEvals && (!canReadAssignedApplications || !loadingAppls);

        if (isFinishedLoading && !hasInitialized) {
            const tabs = [
                { index: 0, count: collabCount },
                { index: 1, count: evalCount },
            ];

            if (canReadAssignedApplications) {
                tabs.push({ index: 2, count: applCount });
            }

            const highestTab = tabs.reduce((max, current) => 
                current.count > max.count ? current : max
            , tabs[0]);

            if (highestTab.count > 0) {
                setActiveIndex(highestTab.index);
            }

            setHasInitialized(true);
        }
    }, [loadingCollabs, loadingEvals, loadingAppls, collabCount, evalCount, applCount, canReadAssignedApplications, hasInitialized]);

    const totalPendingCount = collabCount + evalCount + applCount;

    const renderSpinner = (message: string) => (
        <div className="flex flex-column align-items-center justify-content-center p-4">
            <ProgressSpinner style={{ width: '35px', height: '35px' }} strokeWidth="4" />
            <span className="mt-2 text-500 text-sm font-medium">{message}</span>
        </div>
    );

    const renderEmptyState = (message: string) => (
        <div className="flex flex-column align-items-center justify-content-center p-4 text-center">
            <i className="pi pi-check-circle text-green-500 text-3xl mb-2"></i>
            <span className="text-500 text-sm font-medium">{message}</span>
        </div>
    );

    return (
        <div className="card border-none shadow-1 p-4 mb-4">
            <div className="flex align-items-center justify-content-between mb-3">
                <div className="flex align-items-center gap-2">
                    <div className="relative inline-flex align-items-center justify-content-center p-2 bg-primary-50 border-circle text-primary">
                        <i className="pi pi-bell text-xl"></i>
                        {totalPendingCount > 0 && (
                            <Badge 
                                value={totalPendingCount} 
                                severity="danger" 
                                className="absolute -top-1 -right-1"
                            />
                        )}
                    </div>
                    <h5 className="m-0 text-xl font-bold">My Urgent Pending Works</h5>
                </div>
                
                {totalPendingCount > 0 && (
                    <span className="text-sm text-orange-500 font-semibold">
                        {totalPendingCount} action{totalPendingCount > 1 ? 's' : ''} required
                    </span>
                )}
            </div>

            <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
                <TabPanel header={`Collaborations (${collabCount})`}>
                    {loadingCollabs ? (
                        renderSpinner('Loading pending collaborations...')
                    ) : collabCount === 0 ? (
                        renderEmptyState('No pending collaboration invitations.')
                    ) : (
                        <MyPendingInvitations items={pendingCollaborations} />
                    )}
                </TabPanel>

                <TabPanel header={`Evaluations (${evalCount})`}>
                    {loadingEvals ? (
                        renderSpinner('Loading pending evaluations...')
                    ) : evalCount === 0 ? (
                        renderEmptyState('No pending evaluations found.')
                    ) : (
                        <MyPendingEvaluations items={pendingReviewees} />
                    )}
                </TabPanel>

                {canReadAssignedApplications && (
                    <TabPanel header={`Applications (${applCount})`}>
                        {loadingAppls ? (
                            renderSpinner('Loading pending applications...')
                        ) : applCount === 0 ? (
                            renderEmptyState('No assigned applications pending review.')
                        ) : (
                            <PendingApplications items={shortApplications} />
                        )}
                    </TabPanel>
                )}
            </TabView>
        </div>
    );
};