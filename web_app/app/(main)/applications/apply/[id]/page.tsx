'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// PrimeReact Components
import { BreadCrumb } from 'primereact/breadcrumb';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Sidebar } from 'primereact/sidebar';

// API and Models
import { CallApi } from '@/app/(main)/calls/api/call.api';
import { Call } from '@/app/(main)/calls/models/call.model';

// Local Components
import { ConstraintApi } from '@/app/(main)/constraints/api/constraint.api';
import { ConstraintView } from '@/app/(main)/constraints/components/ConstraintView';
import { Constraint } from '@/app/(main)/constraints/models/constraint.model';
import ApplyWizard from '../wizard/ApplyWizard';
import { Project } from '@/app/(main)/projects/models/project.model';

const ApplyPage = () => {
    const { id: callId } = useParams();
    const router = useRouter();

    const [call, setCall] = useState<Call | null>(null);
    const [project, setProject] = useState<Partial<Project> | null>(null);
    const [constraint, setConstraint] = useState<Constraint | null>(null);


    const [loading, setLoading] = useState(true);
    const [showSidebar, setShowSidebar] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initPage = async () => {
            if (!callId) return;

            try {
                setLoading(true);
                setError(null);

                const callData = await CallApi.getById!(callId as string, true);
                setCall(callData);
                setProject({
                    call: callData,
                    grant: callData.grant,
                    calendar: callData.calendar,
                });

                if (callData.constraint) {
                    const constraintData = await ConstraintApi.getById!(callData.constraint as string);
                    setConstraint(constraintData);
                }

            } catch (err: any) {
                console.error("Initialization error:", err);
                setError("Failed to load application context. Please verify the call ID.");
            } finally {
                setLoading(false);
            }
        };

        initPage();
    }, [callId]);

    const breadcrumbItems = [
        { label: 'Projects', command: () => router.push('/projects') },
        { label: 'Application', className: 'font-bold' }
    ];
    const home = { icon: 'pi pi-home', command: () => router.push('/') };

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

    if (error) {
        return (
            <div className="p-4 surface-ground">
                <Message severity="error" text={error} className="w-full" />
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

            {/* Sidebar */}
            <Sidebar
                visible={showSidebar}
                onHide={() => setShowSidebar(false)}
                position="right"
                className="w-full md:w-30rem p-0"
                blockScroll={false}
                header={
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-shield text-primary text-xl"></i>
                        <span className="font-bold text-xl text-color">
                            Call Requirements
                        </span>
                    </div>
                }
            >
                <div className="px-3 pb-4">
                    {constraint ? (
                        <>
                            <ConstraintView constraint={constraint} />
                            {/* Cautionary Note */}
                            <div className="mt-4 p-3 bg-yellow-50 border-left-3 border-yellow-500 border-round-right">
                                <p className="m-0 text-xs text-yellow-800 line-height-2">
                                    <strong>Note:</strong> Applicants must satisfy all criteria outlined above to meet profile eligibility.
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-column align-items-center justify-content-center py-8 text-center">
                            <i className="pi pi-exclamation-circle text-4xl text-orange-500 mb-3"></i>
                            <p className="text-lg font-semibold text-color m-0">
                                No rules defined
                            </p>
                            <p className="text-sm text-color-secondary mt-1">
                                There are no constraint profiles configured for this grant yet.
                            </p>
                        </div>
                    )}
                </div>
            </Sidebar>

            {/* Breadcrumb */}
            <BreadCrumb
                model={breadcrumbItems}
                home={home}
                className="bg-transparent border-none mb-3 p-0"
            />

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
                        <h2 className="m-0 text-xl font-bold text-color">
                            {call?.title}
                        </h2>

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
                        //  badge={constraints.length > 0 ? constraints.length.toString() : undefined}
                        badgeClassName="p-badge-info"
                        className="p-button-rounded p-button-outlined"
                        onClick={() => setShowSidebar(true)}
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="grid">
                <div className={`col-12 ${showSidebar ? 'lg:col-8 xl:col-9' : 'lg:col-12'} transition-all transition-duration-300`}>

                    <div className="card shadow-2 border-top-3 border-primary surface-card min-h-screen p-0 md:p-4">
                        {call && project ? (
                            <ApplyWizard
                                project={project}
                            //onComplete={(data) => console.log('Final Data', data)}
                            />
                        ) : (
                            <div className="flex align-items-center justify-content-center p-8">
                                <ProgressSpinner />
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ApplyPage;