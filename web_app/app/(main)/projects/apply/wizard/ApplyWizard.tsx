// ApplyWizard.tsx
'use client';

import { Button } from 'primereact/button';
import { Steps } from 'primereact/steps';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Call } from '@/app/(main)/calls/models/call.model';
import { Constraint } from '@/app/(main)/constraints/models/constraint.model';
import { User } from '@/app/(main)/users/models/user.model';
import { useAuth } from '@/contexts/auth-context';

import ProjectForm from '../../components/ProjectForm';
import { Collaborator } from '../../collaborators/models/collaborator.model';
import { Project } from '../../models/project.model';
import CollaboratorsStep, { validateCollaborators } from './steps/CollaboratorsStep';
import SubmissionStep from './steps/SubmissionStep';

interface ApplyWizardProps {
    call?: Call;
    constraint?: Constraint | null;
    onSubmit: (project: Partial<Project>, files: File[]) => Promise<unknown>;
    onComplete?: () => void;
}

const PROJECT_FORM_ID = 'apply-project-form';

const ApplyWizard = ({ call, constraint, onSubmit, onComplete }: ApplyWizardProps) => {
    const router = useRouter();
    const { getUser } = useAuth();
    const appUser = getUser() as User | null;

    const [activeIndex, setActiveIndex] = useState(0);
    const [showErrors, setShowErrors] = useState(false);
    const [project, setProject] = useState<Partial<Project> | null>(null);
    const [collaborators, setCollaborators] = useState<Collaborator[]>(
        appUser ? [{ member: appUser, role: 'Principal Investigator', isLeadPI: true }] : []
    );

    // Stable reference: ProjectForm resets itself whenever `item` changes identity.
    const projectItem = useMemo<Partial<Project>>(
        () =>
            project ??
            (call
                ? ({ call, grant: call.grant, calendar: call.calendar } as Partial<Project>)
                : {}),
        [project, call]
    );

    const steps = [
        { label: 'Project' },
        { label: 'Collaborators' },
        { label: 'Review & Submit' }
    ];

    const next = () => {
        setShowErrors(false);
        setActiveIndex((i) => i + 1);
    };

    const back = () => {
        setShowErrors(false);
        setActiveIndex((i) => i - 1);
    };

    const handleCollaboratorsNext = () => {
        setShowErrors(true);
        if (validateCollaborators(collaborators, constraint).isValid) next();
    };

    return (
        <div className="apply-wizard">
            <Steps model={steps} activeIndex={activeIndex} className="mb-4" readOnly />

            <div className="min-h-20rem">
                {activeIndex === 0 && (
                    <ProjectForm
                        mode="create"
                        formId={PROJECT_FORM_ID}
                        item={projectItem as Project}
                        saving={false}
                        hideSetup={Boolean(call)} // call already chosen -> no setup section
                        onSubmit={async (data) => {
                            setProject(data);
                            next();
                        }}
                        onCancel={() => router.back()}
                    />
                )}

                {activeIndex === 1 && (
                    <CollaboratorsStep
                        collaborators={collaborators}
                        constraint={constraint}
                        showErrors={showErrors}
                        onChange={setCollaborators}
                    />
                )}

                {activeIndex === 2 && project && (
                    <SubmissionStep
                        project={project}
                        collaborators={collaborators}
                        onBack={back}
                        onSubmit={onSubmit}
                        onComplete={onComplete}
                    />
                )}
            </div>

            {/* Footer: the last step renders its own Back/Submit buttons */}
            {activeIndex < 2 && (
                <div className="flex justify-content-between mt-4">
                    <Button
                        type="button"
                        label="Back"
                        icon="pi pi-arrow-left"
                        severity="secondary"
                        outlined
                        disabled={activeIndex === 0}
                        onClick={back}
                    />

                    {activeIndex === 0 ? (
                        // submits ProjectForm; it validates and calls onSubmit -> next()
                        <Button
                            type="submit"
                            form={PROJECT_FORM_ID}
                            label="Next"
                            icon="pi pi-arrow-right"
                            iconPos="right"
                        />
                    ) : (
                        <Button
                            type="button"
                            label="Next"
                            icon="pi pi-arrow-right"
                            iconPos="right"
                            onClick={handleCollaboratorsNext}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default ApplyWizard;