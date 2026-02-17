'use client';

import { useState } from 'react';
import { Organization } from '@/app/(main)/organizations/models/organization.model';
import { WorkspaceSelector } from '@/components/WorkspaceSelector';
import ProjectManager from '../components/ProjectManager';

export default function WorkspaceProjectsPage() {
    const [selectedWorkspace, setSelectedWorkspace] =
        useState<Organization | undefined>();

    return (
        <>
            <WorkspaceSelector
                value={selectedWorkspace}
                onChange={setSelectedWorkspace}
            />
            {selectedWorkspace && (
                <ProjectManager workspace={selectedWorkspace} />
            )}
        </>
    );
}
