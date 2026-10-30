'use client';
import React, { useState } from 'react';
import ProjectManager from './components/ProjectManager';
import { ProjectStatus } from './models/project.model';

type StatusItem = {
    label: string;
    value: ProjectStatus | undefined;
    icon: string;
    accent: string; // hex, used for the active pill, icon and context strip
    description: string;
};

// Projects move through these stages in order, so the UI shows them as a sequence.
const lifecycle: StatusItem[] = [
    { label: 'Drafts', value: ProjectStatus.draft, icon: 'pi pi-file-edit', accent: '#2563eb', description: 'Projects still being written. Nothing has been submitted for review yet.' },
    { label: 'Approved', value: ProjectStatus.approved, icon: 'pi pi-check-circle', accent: '#16a34a', description: 'Projects that passed review and are waiting for funding.' },
    { label: 'Granted', value: ProjectStatus.granted, icon: 'pi pi-gift', accent: '#9333ea', description: 'Projects with funding in place and work under way.' },
    { label: 'Completed', value: ProjectStatus.completed, icon: 'pi pi-flag-fill', accent: '#4f46e5', description: 'Projects whose work is finished and waiting for verification.' },
    { label: 'Verified', value: ProjectStatus.verified, icon: 'pi pi-verified', accent: '#0d9488', description: 'Projects whose results have been checked and signed off.' },
];

// Projects that left the normal flow.
const exits: StatusItem[] = [
    { label: 'Refused', value: ProjectStatus.refused, icon: 'pi pi-times-circle', accent: '#ea580c', description: 'Projects that were reviewed and not accepted.' },
    { label: 'Terminated', value: ProjectStatus.terminated, icon: 'pi pi-ban', accent: '#dc2626', description: 'Projects that were stopped after they started.' },
];

const allItem: StatusItem = {
    label: 'All projects',
    value: undefined,
    icon: 'pi pi-th-large',
    accent: '#334155',
    description: 'Every project in the system, whatever its status.',
};

const Page = () => {
    const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | undefined>(ProjectStatus.granted);

    const everyItem = [...lifecycle, ...exits, allItem];
    const current = everyItem.find((i) => i.value === selectedStatus) ?? allItem;

    const renderPill = (item: StatusItem) => {
        const isSelected = selectedStatus === item.value;
        return (
            <button
                key={item.label}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedStatus(item.value)}
                className={`pm-pill flex align-items-center gap-2 px-3 py-2 border-round-3xl cursor-pointer border-1 font-medium text-sm white-space-nowrap ${isSelected ? 'pm-pill-active' : 'surface-card text-700 surface-border'}`}
                style={
                    isSelected
                        ? { background: item.accent, borderColor: item.accent, color: '#fff', boxShadow: `0 8px 18px -8px ${item.accent}` }
                        : undefined
                }
            >
                <i className={item.icon} style={{ color: isSelected ? '#fff' : item.accent }} />
                <span>{item.label}</span>
            </button>
        );
    };

    return (
        <div className="p-3 md:p-5 surface-ground min-h-screen flex flex-column gap-4">
            <style>{`
                .pm-pill { transition: background-color .18s ease, box-shadow .18s ease, transform .18s ease, border-color .18s ease; }
                .pm-pill:not(.pm-pill-active):hover { background: var(--surface-hover); transform: translateY(-1px); }
                .pm-pill:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
                .pm-rail { scrollbar-width: none; -ms-overflow-style: none; }
                .pm-rail::-webkit-scrollbar { display: none; }
                .pm-strip { transition: border-color .25s ease, background-color .25s ease; }
                @media (prefers-reduced-motion: reduce) {
                    .pm-pill, .pm-strip { transition: none; }
                    .pm-pill:not(.pm-pill-active):hover { transform: none; }
                }
            `}</style>

            {/* HEADER */}
            <header className="surface-card border-round-2xl shadow-1 p-4 flex align-items-center gap-3">
                <span
                    className="flex align-items-center justify-content-center border-round-xl flex-shrink-0"
                    style={{ width: '3.25rem', height: '3.25rem', background: 'var(--primary-color)' }}
                >
                    <i className="pi pi-briefcase text-white text-2xl" />
                </span>
                <div className="flex flex-column gap-1">
                    <h1 className="m-0 text-900 font-bold text-2xl md:text-3xl line-height-1">Projects</h1>
                    <p className="m-0 text-600 text-sm md:text-base">
                        Review, track and manage every project from first draft to final verification.
                    </p>
                </div>
            </header>

            {/* STATUS RAIL */}
            <nav
                role="tablist"
                aria-label="Filter projects by status"
                className="pm-rail flex align-items-center gap-2 overflow-x-auto py-2 px-1"
            >
                {lifecycle.map((item, idx) => (
                    <React.Fragment key={item.label}>
                        {renderPill(item)}
                        {idx < lifecycle.length - 1 && (
                            <i className="pi pi-angle-right text-400 text-sm flex-shrink-0" aria-hidden="true" />
                        )}
                    </React.Fragment>
                ))}

                <span className="surface-border flex-shrink-0 mx-2" style={{ width: 1, height: '1.75rem', borderLeft: '1px solid var(--surface-border)' }} aria-hidden="true" />

                {exits.map(renderPill)}

                <span className="surface-border flex-shrink-0 mx-2" style={{ width: 1, height: '1.75rem', borderLeft: '1px solid var(--surface-border)' }} aria-hidden="true" />

                {renderPill(allItem)}
            </nav>

            {/* MAIN CONTENT */}
            <section className="surface-card border-round-2xl shadow-1 overflow-hidden">
                {/* Context strip: tells the user what the current filter means */}
                <div
                    className="pm-strip flex align-items-center gap-3 px-4 py-3"
                    style={{
                        borderLeft: `4px solid ${current.accent}`,
                        background: `${current.accent}12`,
                    }}
                    aria-live="polite"
                >
                    <i className={`${current.icon} text-xl`} style={{ color: current.accent }} />
                    <div className="flex flex-column">
                        <span className="font-semibold text-900">{current.label}</span>
                        <span className="text-600 text-sm">{current.description}</span>
                    </div>
                </div>

                <div className="p-3 md:p-4">
                    <ProjectManager status={selectedStatus} />
                </div>
            </section>
        </div>
    );
};

export default Page;
