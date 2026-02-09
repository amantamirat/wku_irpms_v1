'use client';
import { useState } from 'react';
import ApplicantManager from './components/ApplicantManager';
import { Organization } from '@/app/(main)/organizations/models/organization.model';
import { WorkspaceSelector } from '@/components/WorkspaceSelector';

const ApplicantPage = () => {
    // Step 1: Manage workspace state at page level
    const [selectedWorkspace, setSelectedWorkspace] = useState<Organization | undefined>();
    return (
        <>
            {/* Step 2: Pass state + setter to WorkspaceSelector */}
            <WorkspaceSelector
                value={selectedWorkspace}
                onChange={setSelectedWorkspace}
            />

            {/* Step 3: Pass selected workspace to ApplicantManager */}
            <ApplicantManager workspace={selectedWorkspace} />
        </>
    );
};

export default ApplicantPage;
