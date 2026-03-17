'use client';

import { useState } from 'react';

import { WorkspaceSelector } from '@/components/WorkspaceSelector';
import ProjectManager from '../components/ProjectManager';
import { Organization } from '../../organizations/models/organization.model';

const ProjectPage = () => {
    const [selectedWorkspace, setSelectedWorkspace] = useState<Organization | undefined>();

    return (
        <div className="flex flex-column gap-4">
            <div className="card">
                <WorkspaceSelector
                    value={selectedWorkspace}
                    onChange={setSelectedWorkspace}
                />
            </div>

            {!selectedWorkspace ? (
                <div className="card p-8 text-center border-dashed border-300">
                    <i className="pi pi-briefcase text-4xl text-400 mb-3"></i>
                    <p className="text-gray-500 text-xl">
                        Please select a workspace to view and manage projects.
                    </p>
                </div>
            ) : (
                <ProjectManager workspace={selectedWorkspace} />
            )}
        </div>
    );
};

export default ProjectPage;