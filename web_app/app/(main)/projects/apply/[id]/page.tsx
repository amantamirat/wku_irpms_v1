// ApplyPage.tsx
'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// PrimeReact Components
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Sidebar } from 'primereact/sidebar';

// API and Models
import { CallApi } from '@/app/(main)/calls/api/call.api';
import { Call } from '@/app/(main)/calls/models/call.model';
import { ConstraintApi } from '@/app/(main)/constraints/api/constraint.api';
import { ConstraintView } from '@/app/(main)/constraints/components/ConstraintView';
import { Constraint } from '@/app/(main)/constraints/models/constraint.model';
import { GrantApi } from '@/app/(main)/grants/api/grant.api';
import { Grant } from '@/app/(main)/grants/models/grant.model';
import { ProjectApi } from '@/app/(main)/projects/api/project.api'; // adjust path

import ApplyWizard from '../wizard/ApplyWizard';
import { Project } from '../../models/project.model';

const ApplyPage = () => {
    const { id: callId } = useParams();
    const router = useRouter();

    const [call, setCall] = useState<Call | null>(null);
    const [constraint, setConstraint] = useState<Constraint | null>(null);

    const [loading, setLoading] = useState(true);
    const [showSidebar, setShowSidebar] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!callId) return;

        let cancelled = false;

        const initPage = async () => {
            try {
                setLoading(true);
                setError(null);

                const callData = await CallApi.getById!(callId as string, true);

                // The wizard needs call.grant populated (themes load from it).
                let grant = callData.grant as Grant | string | undefined;
                if (typeof grant === 'string') {
                    grant = await GrantApi.getById!(grant);
                }

                if (cancelled) return;
                setCall({ ...callData, grant } as Call);

                // Constraint lives on the grant: call.grant.constraint
                // (either already populated, or just an id)
                const constraintRef = (grant as Grant | undefined)?.constraint as
                    | Constraint
                    | string
                    | undefined;

                if (constraintRef) {
                    try {
                        const constraintData =
                            typeof constraintRef === 'string'
                                ? await ConstraintApi.getById!(constraintRef)
                                : constraintRef;

                        if (!cancelled) setConstraint(constraintData);
                    } catch (constraintError) {
                        // Rules are informative; don't block the application
                        console.error('Failed to load constraint:', constraintError);
                    }
                }
            } catch (err) {
                console.error('Initialization error:', err);
                if (!cancelled) {
                    setError('Failed to load application context. Please verify the call ID.');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void initPage();

        return () => {
            cancelled = true;
        };
    }, [callId]);

    // The only place that talks to the API. Errors propagate to SubmissionStep,
    // which shows them in its ValidationReport.
    const handleSubmit = (project: Partial<Project>, files: File[]) =>
        ProjectApi.apply(callId as string, project, files);

    // Runs after the step's success message has been shown.
    const handleComplete = () => router.push('/');

    if (loading) {
        return (
            <div className="flex flex-column align-items-center justify-content-center h-screen surface-ground">
                <ProgressSpinner strokeWidth="3" />
                <span className="mt-3 text-color-secondary font-medium">
                    Loading Application Environment...
                </span>
            </div>
        );
    }

    if (error || !call) {
        return (
            <div className="p-4 surface-ground">
                <Message severity="error" text={error ?? 'Call not found.'} className="w-full" />
                <Button
                    label="Go Back"
                    icon="pi pi-arrow-left"
                    className="mt-3 p-button-text"
                    onClick={() => router.back()}
                />
            </div>
        );
    }

    return (
        <div className="p-2 md:p-4 min-h-screen surface-ground">
            {/* Rules sidebar */}
            <Sidebar
                visible={showSidebar}
                onHide={() => setShowSidebar(false)}
                position="right"
                className="w-full md:w-30rem p-0"
                blockScroll={false}
                header={
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-shield text-primary text-xl"></i>
                        <span className="font-bold text-xl text-color">Call Requirements</span>
                    </div>
                }
            >
                <div className="px-3 pb-4">
                    {constraint ? (
                        <>
                            <ConstraintView constraint={constraint} />
                            <div className="mt-4 p-3 bg-yellow-50 border-left-3 border-yellow-500 border-round-right">
                                <p className="m-0 text-xs text-yellow-800 line-height-2">
                                    <strong>Note:</strong> Applicants must satisfy all criteria outlined
                                    above to meet profile eligibility.
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-column align-items-center justify-content-center py-8 text-center">
                            <i className="pi pi-exclamation-circle text-4xl text-orange-500 mb-3"></i>
                            <p className="text-lg font-semibold text-color m-0">No rules found</p>
                            <p className="text-sm text-color-secondary mt-1">
                                No constraint profile is configured for this grant.
                            </p>
                        </div>
                    )}
                </div>
            </Sidebar>

            {/* Header */}
            <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-4 card shadow-1 p-3 surface-card border-round-xl">
                <div className="flex align-items-center gap-3">
                    <Button
                        icon="pi pi-arrow-left"
                        className="p-button-rounded p-button-text p-button-plain"
                        onClick={() => router.back()}
                        tooltip="Discard and Go Back"
                    />

                    <div>
                        <h2 className="m-0 text-xl font-bold text-color">{call.title}</h2>
                        <div className="flex align-items-center gap-2 mt-1">
                            <i className="pi pi-file-edit text-color-secondary text-xs"></i>
                            <small className="text-color-secondary uppercase font-bold tracking-wider">
                                Project Submission
                            </small>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 mt-3 md:mt-0">
                    <Button
                        label="View Rules"
                        icon="pi pi-info-circle"
                        className="p-button-rounded p-button-outlined"
                        onClick={() => setShowSidebar(true)}
                    />
                </div>
            </div>

            {/* Main content */}
            <div className="grid">
                <div className="col-12">
                    <div className="card shadow-2 border-top-3 border-primary surface-card min-h-screen p-0 md:p-4">
                        <ApplyWizard
                            call={call}
                            constraint={constraint}
                            onSubmit={handleSubmit}
                            onComplete={handleComplete}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApplyPage;