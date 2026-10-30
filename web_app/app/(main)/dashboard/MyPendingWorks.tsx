'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Collaborator, CollaboratorStatus } from '../projects/collaborators/models/collaborator.model';
import { Reviewer, ReviewerStatus } from '../reviewers/models/reviewer.model';
import { Application, ApplicationStatus } from '../applications/models/application.model';
import { CollaboratorApi } from '../projects/collaborators/api/collaborator.api';
import { ReviewerApi } from '../reviewers/api/reviewer.api';
import { ApplicationApi } from '../applications/api/application.api';
import { SpinnerSkeleton } from '@/components/Skeletons';
import { MENU_ICONS } from '@/utils/menu-icons';
import { MY_COLLABORATIONS_PAGE_LINK } from './my-collaborations/page';

interface MyPendingWorksProps {
    canReadAssignedApplications: boolean;
}

interface ActionItem {
    id: string;
    title: string;
    subtitle: string;
    type: 'collaboration' | 'evaluation' | 'application';
    tagLabel: string;
    tagSeverity: 'info' | 'warning' | 'danger' | 'success';
    icon: string;
    actionUrl: string;
    actionLabel: string;
}

export const MyPendingWorks: React.FC<MyPendingWorksProps> = ({
    canReadAssignedApplications,
}) => {
    const [pendingCollaborations, setPendingCollaborations] = useState<Collaborator[]>([]);
    const [pendingReviewees, setPendingReviewees] = useState<Reviewer[]>([]);
    const [shortApplications, setShortApplications] = useState<Application[]>([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPendingData = async () => {
            setLoading(true);
            try {
                const [collabRes, evalRes, appRes] = await Promise.all([
                    CollaboratorApi.me({ status: CollaboratorStatus.pending }).catch(() => []),
                    ReviewerApi.me({ status: ReviewerStatus.pending }).catch(() => []),
                    canReadAssignedApplications
                        ? ApplicationApi.getMyAssignedApplications({ status: ApplicationStatus.shortlisted }).catch(() => [])
                        : Promise.resolve([]),
                ]);

                setPendingCollaborations(Array.isArray(collabRes) ? collabRes : []);
                setPendingReviewees(Array.isArray(evalRes) ? evalRes : []);
                setShortApplications(Array.isArray(appRes) ? appRes : []);
            } catch (error) {
                console.error('Error loading pending works:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPendingData();
    }, [canReadAssignedApplications]);

    // Format all pending items into unified actionable alerts
    const items: ActionItem[] = [
        ...pendingCollaborations.map((collab) => {
            const projectTitle =
                typeof collab.project === 'object' ? collab.project.title : 'Project Invitation';
            return {
                id: `collab-${collab._id}`,
                title: projectTitle,
                subtitle: 'You have been invited to join this project team.',
                type: 'collaboration' as const,
                tagLabel: 'Collaboration',
                tagSeverity: 'info' as const,
                icon: MENU_ICONS.collaborators,
                actionUrl: MY_COLLABORATIONS_PAGE_LINK,
                actionLabel: 'Respond to Invite',
            };
        }),
        ...pendingReviewees.map((rev) => {
            const reviewTitle = typeof rev.project === 'object' ? rev.project.title : 'Evaluation Request';
            return {
                id: `eval-${rev._id}`,
                title: reviewTitle,
                subtitle: `Pending evaluation / ${rev.targetType}.`,
                type: 'evaluation' as const,
                tagLabel: 'Evaluation',
                tagSeverity: 'success' as const,
                icon: MENU_ICONS.reviewers,
                actionUrl: '/dashboard/my-evaluations',
                actionLabel: 'Respond to Review',
            };
        }),
        ...shortApplications.map((app) => {
            const appTitle = "Application";
            return {
                id: `app-${app._id}`,
                title: appTitle,
                subtitle: 'Assigned application awaiting your review.',
                type: 'application' as const,
                tagLabel: 'Application',
                tagSeverity: 'warning' as const,
                icon: 'pi pi-paperclip',
                actionUrl: '/dashboard/assigned-applications',
                actionLabel: 'Review Application',
            };
        }),
    ];

    if (loading) {
        return (
            <div className="card border-none shadow-1 p-4 mb-4 surface-card">
                <SpinnerSkeleton text="Checking for pending actions..." />
            </div>
        );
    }

    // Modern "All Clear" state when no items need attention
    if (items.length === 0) {
        return (
            <div className="card border-none shadow-1 p-4 mb-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-round-xl">
                <div className="flex align-items-center gap-3">
                    <div className="flex align-items-center justify-content-center bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-circle p-3">
                        <i className="pi pi-check-circle text-2xl"></i>
                    </div>
                    <div>
                        <h5 className="m-0 text-lg font-bold text-green-900 dark:text-green-100">You're all caught up!</h5>
                        <p className="m-0 text-sm text-green-700 dark:text-green-300">No urgent tasks or invitations require your attention right now.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card border-none shadow-1 p-4 mb-4 bg-orange-50/30 dark:bg-orange-950/20 border-round-xl border-1 border-orange-200 dark:border-orange-900/50">
            {/* Header Alert Bar */}
            <div className="flex align-items-center justify-content-between mb-3 border-bottom-1 border-orange-200 dark:border-orange-900/50 pb-3">
                <div className="flex align-items-center gap-3">
                    <div className="relative flex align-items-center justify-content-center bg-orange-500 text-white border-circle p-2 shadow-2">
                        <i className="pi pi-bell text-xl animate-pulse"></i>
                    </div>
                    <div>
                        <div className="flex align-items-center gap-2">
                            <h5 className="m-0 text-lg font-bold text-900">Action Required</h5>
                            <span className="bg-orange-500 text-white text-xs font-semibold px-2 py-1 border-round-pill">
                                {items.length} Pending
                            </span>
                        </div>
                        <p className="text-xs text-600 m-0 mt-1">
                            Items below require your direct review or decision.
                        </p>
                    </div>
                </div>
            </div>

            {/* Attention Cards List */}
            <div className="flex flex-column gap-3">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="flex flex-column md:flex-row md:align-items-center justify-content-between p-3 surface-card border-1 surface-border border-round-lg shadow-2 hover:border-orange-400 transition-all transition-duration-200 gap-3"
                    >
                        <div className="flex align-items-start gap-3">
                            <div className="flex align-items-center justify-content-center surface-ground text-color-secondary border-round-md p-2 mt-1 md:mt-0">
                                <i className={`${item.icon} text-lg`}></i>
                            </div>
                            <div>
                                <div className="flex align-items-center gap-2 mb-1">
                                    <Tag value={item.tagLabel} severity={item.tagSeverity} className="text-xs px-2 py-0.5"></Tag>
                                    <h6 className="m-0 text-base font-semibold text-900 truncate max-w-20rem" title={item.title}>
                                        {item.title}
                                    </h6>
                                </div>
                                <p className="m-0 text-xs text-600">{item.subtitle}</p>
                            </div>
                        </div>

                        {/* CTA Link Button */}
                        <div className="flex align-items-center justify-content-end">
                            <Link href={item.actionUrl} passHref>
                                <Button
                                    label={item.actionLabel}
                                    icon="pi pi-arrow-right"
                                    iconPos="right"
                                    className="p-button-sm p-button-warning p-button-outlined font-semibold text-xs"
                                />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};