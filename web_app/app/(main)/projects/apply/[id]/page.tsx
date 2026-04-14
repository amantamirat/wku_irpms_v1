'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

// PrimeReact Components
import { BreadCrumb } from 'primereact/breadcrumb';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Sidebar } from 'primereact/sidebar';
import { Message } from 'primereact/message';

// API and Models
import { CallApi } from '@/app/(main)/calls/api/call.api';
import { Call } from '@/app/(main)/calls/models/call.model';
import { GrantAllocationApi } from '@/app/(main)/grants/allocations/api/grant.allocation.api';
import { ConstraintApi } from '@/app/(main)/grants/constraints/api/constraint.api';
import { Constraint } from '@/app/(main)/grants/constraints/models/constraint.model';

// Local Components
import { CallPreview } from '../CallPreview';
import ApplyWizard from '../ApplyWizard';
import { GrantAllocation } from '@/app/(main)/grants/allocations/models/grant.allocation.model';

const ProjectApplyPage = () => {
    const { id: callId } = useParams();
    const router = useRouter();

    // State
    const [call, setCall] = useState<Call | null>(null);
    const [constraints, setConstraints] = useState<Constraint[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSidebar, setShowSidebar] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initPage = async () => {
            if (!callId) return;

            try {
                setLoading(true);
                setError(null);

                // 1. Fetch Call Details
                const callData = await CallApi.getById!(callId as string, true);
                setCall(callData);

                const grantId = (callData as any).grantAllocation.grant._id;
                if (grantId) {
                    const cons = await ConstraintApi.getAll({ grant: grantId });
                    setConstraints(cons || []);
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

    // Navigation configuration
    const breadcrumbItems = [
        { label: 'Projects', command: () => router.push('/projects') },
        { label: 'Application', className: 'font-bold' }
    ];
    const home = { icon: 'pi pi-home', command: () => router.push('/') };

    if (loading) {
        return (
            <div className="flex flex-column align-items-center justify-content-center h-screen">
                <ProgressSpinner strokeWidth="3" />
                <span className="mt-3 text-500 font-medium">Loading Application Environment...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4">
                <Message severity="error" text={error} className="w-full" />
                <Button label="Go Back" icon="pi pi-arrow-left" className="mt-3 p-button-text" onClick={() => router.back()} />
            </div>
        );
    }

    return (
        <div className="p-2 md:p-4 min-h-screen surface-ground">
            {/* 🟢 Mobile & Desktop Sidebar (Drawer Style) */}
            <Sidebar
                visible={showSidebar}
                onHide={() => setShowSidebar(false)}
                position="right"
                className="w-full md:w-30rem p-0"
                blockScroll={false}
                header={
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-shield text-primary text-xl"></i>
                        <span className="font-bold text-xl">Grant Requirements</span>
                    </div>
                }
            >
                <div className="px-3 pb-4">
                    {call && <CallPreview call={call} constraints={constraints} />}
                </div>
            </Sidebar>

            {/* Breadcrumbs */}
            <BreadCrumb model={breadcrumbItems} home={home} className="bg-transparent border-none mb-3 p-0" />

            {/* Header Card */}
            <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-4 card shadow-1 p-3 bg-white border-round-xl">
                <div className="flex align-items-center gap-3">
                    <Button
                        icon="pi pi-arrow-left"
                        className="p-button-rounded p-button-text p-button-plain"
                        onClick={() => router.back()}
                        tooltip="Discard and Go Back"
                    />
                    <div>
                        <h2 className="m-0 text-xl font-bold text-900">{call?.title}</h2>
                        <div className="flex align-items-center gap-2 mt-1">
                            <i className="pi pi-file-edit text-500 text-xs"></i>
                            <small className="text-500 uppercase font-bold tracking-wider">Project Submission</small>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 mt-3 md:mt-0">
                    <Button
                        label="View Rules"
                        icon="pi pi-info-circle"
                        badge={constraints.length > 0 ? constraints.length.toString() : undefined}
                        badgeClassName="p-badge-info"
                        className="p-button-rounded p-button-outlined"
                        onClick={() => setShowSidebar(true)}
                    />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid">
                <div className={`col-12 ${showSidebar ? 'lg:col-8 xl:col-9' : 'lg:col-12'} transition-all transition-duration-300`}>

                    <div className="card shadow-2 border-top-3 border-primary bg-white min-h-screen p-0 md:p-4">
                        {call ? (
                            <ApplyWizard
                                call={call}
                                //constraints={constraints}
                                onComplete={(data) => console.log('Final Data', data)}
                            />
                        ) : (
                            <div className="flex align-items-center justify-content-center p-8">
                                <ProgressSpinner />
                            </div>
                        )}
                    </div>
                </div>

                {/* The Desktop Sidebar remains here... */}
            </div>
        </div>
    );
};

export default ProjectApplyPage;