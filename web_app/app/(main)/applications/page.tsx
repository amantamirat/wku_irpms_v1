'use client';

import { CallApi } from '@/app/(main)/calls/api/call.api';
import { Call } from '@/app/(main)/calls/models/call.model';
import { StageApi } from '@/app/(main)/calls/stages/api/stage.api';
import { Stage } from '@/app/(main)/calls/stages/models/stage.model';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Skeleton } from 'primereact/skeleton';
import { TabPanel, TabView } from 'primereact/tabview';
import { useEffect, useState } from 'react';
import ApplicationManager from './components/ApplicationManager';

const Page = () => {
    const [calls, setCalls] = useState<Call[]>([]);
    const [selectedCall, setSelectedCall] = useState<Call | null>(null);
    const [stages, setStages] = useState<Stage[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);

    const [loadingCalls, setLoadingCalls] = useState(true);
    const [loadingStages, setLoadingStages] = useState(false);
    const [callsError, setCallsError] = useState(false);
    const [stagesError, setStagesError] = useState(false);

    // Bump these to retry a failed request.
    const [callsReload, setCallsReload] = useState(0);
    const [stagesReload, setStagesReload] = useState(0);

    // Load calls once (and on retry). `cancelled` stops a late response from
    // updating state after the component has unmounted.
    useEffect(() => {
        let cancelled = false;

        const fetchCalls = async () => {
            setLoadingCalls(true);
            setCallsError(false);
            try {
                const data = (await CallApi.lookup?.()) ?? [];
                if (cancelled) return;
                setCalls(data);
                // Keep the current choice on retry; otherwise default to the first call.
                setSelectedCall((prev) => prev ?? data[0] ?? null);
            } catch {
                if (!cancelled) setCallsError(true);
            } finally {
                if (!cancelled) setLoadingCalls(false);
            }
        };

        fetchCalls();
        return () => {
            cancelled = true;
        };
    }, [callsReload]);

    // Load stages whenever the call changes. Switching calls quickly can no
    // longer show stages from the previous call, because the old request is ignored.
    useEffect(() => {
        let cancelled = false;

        if (!selectedCall) {
            setStages([]);
            setStagesError(false);
            setLoadingStages(false);
            return;
        }

        const fetchStages = async () => {
            setLoadingStages(true);
            setStagesError(false);
            setStages([]);
            setActiveIndex(0);
            try {
                const data = (await StageApi.lookup?.({ call: selectedCall })) ?? [];
                if (!cancelled) setStages(data);
            } catch {
                if (!cancelled) setStagesError(true);
            } finally {
                if (!cancelled) setLoadingStages(false);
            }
        };

        fetchStages();
        return () => {
            cancelled = true;
        };
    }, [selectedCall, stagesReload]);

    const renderBody = () => {
        if (callsError) {
            return (
                <EmptyState
                    icon="pi pi-exclamation-triangle"
                    title="Couldn't load calls"
                    text="Check your connection and try again."
                    action={<Button label="Try again" icon="pi pi-refresh" size="small" onClick={() => setCallsReload((n) => n + 1)} />}
                />
            );
        }

        if (loadingCalls) return <StagesSkeleton />;

        if (!selectedCall) {
            return (
                <EmptyState
                    icon="pi pi-folder-open"
                    title="No call selected"
                    text="Choose a call above to see its stages and applications."
                />
            );
        }

        if (stagesError) {
            return (
                <EmptyState
                    icon="pi pi-exclamation-triangle"
                    title="Couldn't load stages"
                    text={`The stages for "${selectedCall.title}" failed to load.`}
                    action={<Button label="Try again" icon="pi pi-refresh" size="small" onClick={() => setStagesReload((n) => n + 1)} />}
                />
            );
        }

        if (loadingStages) return <StagesSkeleton />;

        if (stages.length === 0) {
            return (
                <EmptyState
                    icon="pi pi-sitemap"
                    title="No stages yet"
                    text="This call has no stages, so there are no applications to review. Add stages to the call first."
                />
            );
        }

        return (
            <TabView
                activeIndex={activeIndex}
                onTabChange={(e) => setActiveIndex(e.index)}
                scrollable
                renderActiveOnly
                className="app-tabs"
            >
                {stages.map((stage, index) => (
                    <TabPanel
                        key={stage._id}
                        header={
                            <span className="flex align-items-center gap-2">
                                <span className="stage-badge">{index + 1}</span>
                                <span>{stage.name}</span>
                            </span>
                        }
                    >
                        <ApplicationManager stage={stage} enableDetail={true} disableCrud={true} />
                    </TabPanel>
                ))}
            </TabView>
        );
    };

    return (
        <div className="p-3 md:p-5 surface-ground min-h-screen flex flex-column gap-4">
            <style>{`
                .app-tabs .p-tabview-nav { border-width: 0 0 1px 0; background: transparent; }
                .app-tabs .p-tabview-nav li .p-tabview-nav-link { background: transparent; border-radius: .75rem .75rem 0 0; padding: .85rem 1.1rem; transition: color .18s ease, background-color .18s ease; }
                .app-tabs .p-tabview-nav li:not(.p-highlight):not(.p-disabled):hover .p-tabview-nav-link { background: var(--surface-hover); }
                .app-tabs .p-tabview-panels { background: transparent; padding: 1.5rem 0 0 0; }
                .stage-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.5rem; padding: 0 .35rem; border-radius: 999px; font-size: .75rem; font-weight: 700; background: var(--surface-200); color: var(--text-color-secondary); transition: background-color .18s ease, color .18s ease; }
                .app-tabs .p-highlight .stage-badge { background: var(--primary-color); color: var(--primary-color-text); }
                .call-strip { transition: border-color .25s ease; }
                @media (prefers-reduced-motion: reduce) {
                    .app-tabs .p-tabview-nav li .p-tabview-nav-link, .stage-badge, .call-strip { transition: none; }
                }
            `}</style>

            {/* HEADER */}
            <header className="surface-card border-round-2xl shadow-1 p-4 flex align-items-center gap-3">
                <span
                    className="flex align-items-center justify-content-center border-round-xl flex-shrink-0"
                    style={{ width: '3.25rem', height: '3.25rem', background: 'var(--primary-color)' }}
                >
                    <i className="pi pi-inbox text-white text-2xl" />
                </span>
                <div className="flex flex-column gap-1">
                    <h3 className="m-0 text-900 font-bold text-2xl md:text-3xl line-height-1">Applications</h3>
                    <p className="m-0 text-600 text-sm md:text-base">
                        Review, evaluate and manage applications stage by stage.
                    </p>
                </div>
            </header>

            {/* CALL PICKER */}
            <section className="surface-card border-round-2xl shadow-1 p-4 flex flex-column md:flex-row md:align-items-end md:justify-content-between gap-4">
                <div className="flex flex-column gap-2">
                    <label htmlFor="call-select" className="text-700 font-medium text-sm">
                        Call
                    </label>
                    <Dropdown
                        inputId="call-select"
                        value={selectedCall}
                        options={calls}
                        onChange={(e) => setSelectedCall(e.value ?? null)}
                        optionLabel="title"
                        placeholder={loadingCalls ? 'Loading calls…' : 'Choose a call'}
                        disabled={loadingCalls || calls.length === 0}
                        filter={calls.length > 8}
                        showClear
                        className="w-full md:w-22rem"
                    />
                </div>

                {selectedCall && (
                    <div
                        className="call-strip flex align-items-center gap-3 border-round-xl px-3 py-2 border-1 surface-border"
                        style={{
                            borderLeft: '4px solid var(--primary-color)',
                            backgroundColor: 'var(--surface-card)'
                        }}
                        aria-live="polite"
                    >
                        <i className="pi pi-sitemap text-primary text-xl" />
                        <div className="flex flex-column">
                            <span className="text-900 font-semibold">{selectedCall.title}</span>
                            <span className="text-600 text-sm">
                                {loadingStages
                                    ? 'Loading stages…'
                                    : stagesError
                                        ? 'Stages unavailable'
                                        : `${stages.length} ${stages.length === 1 ? 'stage' : 'stages'}`}
                            </span>
                        </div>
                    </div>
                )}
            </section>

            {/* MAIN CONTENT */}
            <section className="surface-card border-round-2xl shadow-1 p-3 md:p-4">{renderBody()}</section>
        </div>
    );
};

const EmptyState = ({
    icon,
    title,
    text,
    action,
}: {
    icon: string;
    title: string;
    text: string;
    action?: React.ReactNode;
}) => (
    <div className="flex flex-column align-items-center justify-content-center py-7 px-3 text-center gap-2">
        <span
            className="flex align-items-center justify-content-center border-circle surface-100 mb-2"
            style={{ width: '4rem', height: '4rem' }}
        >
            <i className={`${icon} text-2xl text-500`} />
        </span>
        <h3 className="m-0 text-900 font-semibold text-lg">{title}</h3>
        <p className="m-0 text-600 text-sm line-height-3" style={{ maxWidth: '26rem' }}>
            {text}
        </p>
        {action && <div className="mt-3">{action}</div>}
    </div>
);

const StagesSkeleton = () => (
    <div className="flex flex-column gap-4" aria-busy="true" aria-label="Loading">
        <div className="flex gap-3">
            <Skeleton width="9rem" height="2.5rem" borderRadius="0.75rem" />
            <Skeleton width="9rem" height="2.5rem" borderRadius="0.75rem" />
            <Skeleton width="9rem" height="2.5rem" borderRadius="0.75rem" />
        </div>
        <Skeleton width="100%" height="12rem" borderRadius="1rem" />
    </div>
);

export default Page;
