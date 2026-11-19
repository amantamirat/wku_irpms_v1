'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Collaborator, CollaboratorStatus } from '../projects/collaborators/models/collaborator.model';
import { Reviewer, ReviewerStatus } from '../reviewers/models/reviewer.model';
import { Application, ApplicationStatus } from '../applications/models/application.model';
import { Project, ProjectNextStage } from '../projects/models/project.model';
import { CollaboratorApi } from '../projects/collaborators/api/collaborator.api';
import { ReviewerApi } from '../reviewers/api/reviewer.api';
import { ApplicationApi } from '../applications/api/application.api';
import { ProjectApi } from '../projects/api/project.api';
import ApplicationForm from '../applications/components/ApplicationForm'; // adjust path
import { SpinnerSkeleton } from '@/components/Skeletons';
import { MENU_ICONS } from '@/utils/menu-icons';
import { extractId } from '@/utils/utils';
import { MY_COLLABORATIONS_PAGE_LINK } from './my-collaborations/page';

interface MyPendingWorksProps {
    canReadAssignedApplications: boolean;
}

interface ActionItem {
    id: string;
    title: string;
    subtitle: string;
    type: 'collaboration' | 'evaluation' | 'application' | 'next-stage'; // new type
    tagLabel: string;
    tagSeverity: 'info' | 'warning' | 'danger' | 'success';
    icon: string;
    actionLabel: string;
    actionUrl?: string;      // link items
    onAction?: () => void;   // dialog items
}

const NEXT_STAGE_FORM_ID = 'continue-application-form';

export const MyPendingWorks: React.FC<MyPendingWorksProps> = ({
    canReadAssignedApplications,
}) => {
    const toast = useRef<Toast>(null);

    const [pendingCollaborations, setPendingCollaborations] = useState<Collaborator[]>([]);
    const [pendingReviewees, setPendingReviewees] = useState<Reviewer[]>([]);
    const [shortApplications, setShortApplications] = useState<Application[]>([]);
    const [readyProjects, setReadyProjects] = useState<ProjectNextStage[]>([]); // new

    const [continueProject, setContinueProject] = useState<Project | null>(null); // new
    const [saving, setSaving] = useState(false);                                  // new
    const [loading, setLoading] = useState(true);

    const fetchPendingData = useCallback(async () => {
        try {
            const [collabRes, evalRes, appRes, readyRes] = await Promise.all([
                CollaboratorApi.me({ status: CollaboratorStatus.pending }).catch(() => []),
                ReviewerApi.me({ status: ReviewerStatus.pending }).catch(() => []),
                canReadAssignedApplications
                    ? ApplicationApi.getMyAssignedApplications({ status: ApplicationStatus.shortlisted }).catch(() => [])
                    : Promise.resolve([]),
                ProjectApi.meReadyForNextStage().catch(() => []), // new
            ]);

            setPendingCollaborations(Array.isArray(collabRes) ? collabRes : []);
            setPendingReviewees(Array.isArray(evalRes) ? evalRes : []);
            setShortApplications(Array.isArray(appRes) ? appRes : []);
            setReadyProjects(Array.isArray(readyRes) ? readyRes : []);
        } catch (error) {
            console.error('Error loading pending works:', error);
        }
    }, [canReadAssignedApplications]);

    useEffect(() => {
        setLoading(true);
        fetchPendingData().finally(() => setLoading(false));
    }, [fetchPendingData]);

    /* Submit the next-stage application (new) */
    const handleContinueSubmit = async (app: Partial<Application>) => {
        setSaving(true);
        try {
            await ApplicationApi.create({
                ...app,
                project: extractId(app.project) as any, // the form may hold the whole project object
            });

            setContinueProject(null);
            toast.current?.show({
                severity: 'success',
                summary: 'Application submitted',
                detail: 'Your application for the next stage was submitted.',
            });
            await fetchPendingData(); // the project drops out of the list
        } catch (err) {
            // rethrow so ApplicationForm's handleError shows the server validation report
            throw err;
        } finally {
            setSaving(false);
        }
    };

    const items: ActionItem[] = [
        // New: projects accepted and ready for the next stage
        ...readyProjects.map(({ project, nextStage }) => {
            const deadline = nextStage.deadline
                ? new Date(nextStage.deadline).toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                })
                : null;

            return {
                id: `next-stage-${project._id}`,
                title: project.title,
                subtitle: `You passed the previous stage. "${nextStage.name}" is open${deadline ? ` until ${deadline}` : ''
                    }.`,
                type: 'next-stage' as const,
                tagLabel: 'Next Stage',
                tagSeverity: 'success' as const,
                icon: 'pi pi-forward',
                actionLabel: 'Continue Application',
                onAction: () => setContinueProject(project),
            };
        }),
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
        ...shortApplications.map((app) => ({
            id: `app-${app._id}`,
            title: 'Application',
            subtitle: 'Assigned application awaiting your review.',
            type: 'application' as const,
            tagLabel: 'Application',
            tagSeverity: 'warning' as const,
            icon: 'pi pi-paperclip',
            actionUrl: '/dashboard/assigned-applications',
            actionLabel: 'Review Application',
        })),
    ];

    if (loading) {
        return (
            <div className="card border-none shadow-1 p-4 mb-4 surface-card">
                <SpinnerSkeleton text="Checking for pending actions..." />
            </div>
        );
    }

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

    const buttonClass = 'p-button-sm p-button-warning p-button-outlined font-semibold text-xs';

    return (
        <div className="card border-none shadow-1 p-4 mb-4 bg-orange-50/30 dark:bg-orange-950/20 border-round-xl border-1 border-orange-200 dark:border-orange-900/50">
            <Toast ref={toast} />

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

                        <div className="flex align-items-center justify-content-end">
                            {item.onAction ? (
                                <Button
                                    label={item.actionLabel}
                                    icon="pi pi-arrow-right"
                                    iconPos="right"
                                    className={buttonClass}
                                    onClick={item.onAction}
                                />
                            ) : (
                                <Link href={item.actionUrl!} passHref>
                                    <Button
                                        label={item.actionLabel}
                                        icon="pi pi-arrow-right"
                                        iconPos="right"
                                        className={buttonClass}
                                    />
                                </Link>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Continue application dialog (new) */}
            <Dialog
                header="Continue Application"
                visible={!!continueProject}
                onHide={() => !saving && setContinueProject(null)}
                style={{ width: '40rem', maxWidth: '95vw' }}
                modal
                footer={
                    <div className="flex justify-content-end gap-2">
                        <Button
                            label="Cancel"
                            text
                            severity="secondary"
                            onClick={() => setContinueProject(null)}
                            disabled={saving}
                        />
                        <Button
                            type="submit"
                            form={NEXT_STAGE_FORM_ID}
                            label={saving ? 'Submitting...' : 'Submit Application'}
                            icon={saving ? 'pi pi-spin pi-spinner' : 'pi pi-send'}
                            iconPos="right"
                            disabled={saving}
                        />
                    </div>
                }
            >
                {continueProject && (
                    <ApplicationForm
                        mode="create"
                        formId={NEXT_STAGE_FORM_ID}
                        project={continueProject}
                        item={undefined as any}
                        saving={saving}
                        onSubmit={handleContinueSubmit}
                        onCancel={() => setContinueProject(null)}
                    />
                )}
            </Dialog>
        </div>
    );
};