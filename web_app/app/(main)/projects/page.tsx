'use client';

import { useState } from 'react';
import ProjectManager from './components/ProjectManager';
import { Organization } from '../organizations/models/organization.model';
import { WorkspaceSelector } from '@/components/WorkspaceSelector';

const ProjectPage = () => {
    const [selectedWorkspace, setSelectedWorkspace] = useState<Organization | undefined>();
    return (
        <>
            <WorkspaceSelector
                value={selectedWorkspace}
                onChange={setSelectedWorkspace}
            />
            {!selectedWorkspace && (
                <div className="p-4 text-gray-500">
                    Please select a workspace to view projects.
                </div>
            )}
            {selectedWorkspace &&
                <ProjectManager workspace={selectedWorkspace} />}
        </>
    );
};

export default ProjectPage;
