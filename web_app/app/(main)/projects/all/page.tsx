'use client';

import { useMemo, useState } from 'react';
import ProjectManager from '../components/ProjectManager';
import { Project } from '../models/project.model';
import { PROJECT_STATUS_ORDER } from '../models/project.state-machine';
import { STATUS_BUTTON_CONFIG } from '@/components/status-button.config';

const ProjectPage = () => {
    const [projects, setProjects] = useState<Project[]>([]);

    const statusCounts = useMemo(() => {
        return projects.reduce((acc, project) => {
            const status = project.status || "Draft";
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [projects]);

    return (
        <div className="flex flex-column gap-4 p-4 bg-gray-50 min-h-screen">

            {/* HEADER */}
            <div className="flex justify-content-between align-items-end">
                <div>
                    <h2 className="text-2xl font-bold text-900 m-0 line-height-2">
                        Project Dashboard
                    </h2>
                    <p className="text-500 text-sm m-0">
                        Overview and management of all submitted projects
                    </p>
                </div>
            </div>

            {/* SUMMARY CARDS - More compact and professional */}
            {/* SUMMARY CARDS - Compact & Professional */}
            {projects.length > 0 && (
                <div className="flex flex-wrap gap-3">
                    {PROJECT_STATUS_ORDER.map((status) => {
                        const count = statusCounts[status] || 0;
                        const config = STATUS_BUTTON_CONFIG[status.toLowerCase()] || STATUS_BUTTON_CONFIG.draft;

                        if (count === 0 && status.toLowerCase() !== 'draft') return null;

                        return (
                            <div key={status} className="flex-1 min-w-min" style={{ maxWidth: '240px' }}>
                                <div className="bg-white border-round-lg shadow-1 hover:shadow-2 transition-duration-200 border-left-3"
                                    style={{ borderLeftColor: `var(--${config.color?.split('-')[1] || 'blue'}-500)` }}>
                                    <div className="p-3">
                                        <div className="flex align-items-center justify-content-between gap-4">
                                            <div>
                                                <span className="block text-500 font-semibold text-xs uppercase tracking-wider mb-1">
                                                    {status}
                                                </span>
                                                <div className="text-xl font-bold text-900">
                                                    {count}
                                                </div>
                                            </div>
                                            <div className={`w-2rem h-2rem flex align-items-center justify-content-center border-round ${config.color} opacity-80`}>
                                                <i className={`${config.icon} text-sm`}></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* TABLE SECTION */}
            <div className="bg-white border-round-xl shadow-1 overflow-hidden">
                {/* TABLE HEADER */}
                <div className="px-4 py-3 border-bottom-1 surface-border flex justify-content-between align-items-center">
                    <div>
                        <h3 className="text-lg font-bold text-900 m-0">Project List</h3>
                        <span className="text-500 text-xs uppercase font-medium">Total: {projects.length} Items</span>
                    </div>
                </div>

                {/* TABLE CONTENT */}
                <div className="p-2">
                    <ProjectManager onItemsChange={setProjects} />
                </div>
            </div>

            {/* EMPTY STATE */}
            {projects.length === 0 && (
                <div className="flex flex-column align-items-center justify-content-center py-8 bg-white border-round-xl border-1 surface-border border-dashed">
                    <i className="pi pi-folder-open text-400 text-5xl mb-3"></i>
                    <div className="text-900 font-medium text-xl mb-1">No projects found</div>
                    <div className="text-500">Your project list is currently empty.</div>
                </div>
            )}
        </div>
    );
};

export default ProjectPage;