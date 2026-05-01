'use client';

import { useMemo, useState } from 'react';
import ProjectManager from '../components/ProjectManager';
import { Project } from '../models/project.model';
import { PROJECT_STATUS_ORDER } from '../models/project.state-machine';
import { STATUS_BUTTON_CONFIG } from '@/components/status-button.config';

const ProjectPage = () => {
    const [projects, setProjects] = useState<Project[]>([]);

    // Aggregate counts
    const statusCounts = useMemo(() => {
        return projects.reduce((acc, project) => {
            const status = project.status || "Draft";
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [projects]);

    return (
        <div className="flex flex-column gap-4 p-4">

            {/* HEADER */}
            <div>
                <h2 className="text-2xl font-semibold text-900 m-0">
                    All Projects
                </h2>
                <span className="text-500 text-sm">
                    Overview and management of all submitted projects
                </span>
            </div>

            {/* SUMMARY CARDS */}
            {projects.length > 0 && (
                <div className="grid">
                    {PROJECT_STATUS_ORDER.map((status) => {
                        const count = statusCounts[status] || 0;
                        const config =
                            STATUS_BUTTON_CONFIG[status.toLowerCase()] ||
                            STATUS_BUTTON_CONFIG.draft;

                        if (count === 0 && status.toLowerCase() !== 'draft') return null;

                        return (
                            <div key={status} className="col-12 md:col-6 lg:col-3">
                                <div className="bg-white border-round-xl p-4 shadow-1 h-full flex flex-column justify-content-between hover:shadow-2 transition-all">

                                    {/* TOP */}
                                    <div className="flex justify-content-between align-items-center mb-3">
                                        <span className="text-500 text-sm font-medium uppercase">
                                            {status}
                                        </span>

                                        <div className={`w-2.5rem h-2.5rem flex align-items-center justify-content-center border-round ${config.color}`}>
                                            <i className={config.icon}></i>
                                        </div>
                                    </div>

                                    {/* COUNT */}
                                    <div className="text-900 text-3xl font-bold">
                                        {count}
                                    </div>

                                    <span className="text-400 text-xs mt-2">
                                        ...
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* TABLE */}
            <div className="bg-white border-round-xl shadow-1">

                {/* TABLE HEADER */}
                <div className="px-4 py-3 border-bottom-1 surface-border">
                    <h3 className="text-lg font-semibold text-900 m-0">
                        Project List
                    </h3>
                    <span className="text-500 text-sm">
                        Manage and review all projects
                    </span>
                </div>

                {/* TABLE CONTENT */}
                <div className="p-3">
                    <ProjectManager onItemsChange={setProjects} />
                </div>
            </div>

            {/* EMPTY STATE */}
            {projects.length === 0 && (
                <div className="text-center py-6 text-500">
                    No projects found
                </div>
            )}

        </div>
    );
};

export default ProjectPage;