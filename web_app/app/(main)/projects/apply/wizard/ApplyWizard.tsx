'use client';
import { useAuth } from '@/contexts/auth-context';
import { Steps } from 'primereact/steps';
import { useState } from 'react';
import { BasicInfoStep } from '../../components/wirzard/BasicInfoStep';
import { CollaboratorsStep } from '../../components/wirzard/CollaboratorsStep';
import { PhasesStep } from '../../components/wirzard/PhasesStep';
import { Project } from '../../models/project.model';
import { SubmissionStep } from './SubmissionStep';


interface ApplyWizardProps {
    project?: Partial<Project>;
    onComplete?: (data: any) => void;
}

const ApplyWizard = ({ project, onComplete }: ApplyWizardProps) => {
    const { getUser } = useAuth();
    const appUser = getUser();
    const [activeIndex, setActiveIndex] = useState(0);
    const [formData, setFormData] = useState<Project>({
        ...project,
        title: '',
        summary: '',
        themes: [],
        leadPI: appUser ? appUser : "",
        collaborators: [{ member: appUser?._id, role: "Principal Investigator", isLeadPI: true }],
        components: typeof project?.call === 'object' && project.call?.componentBased
            ? [{ title: '', contributors: [] }]
            : [],
        phases: [{
            title: 'Phase 1',
            order: 1,
            budget: 1000,
            duration: 10,
            description: ''
        }]
    });

    const wizardSteps = [
        { label: 'Basic Information' },
        { label: 'Collaborators' },
        { label: 'Budget & Phases' },
        { label: 'Submission' }
    ];

    const updateFormData = (data: Partial<Project>) => {
        setFormData(prev => ({ ...prev, ...data }));
    };

    const handleNext = () => {
        setActiveIndex(prev => prev + 1);
    };

    const handleBack = () => {
        setActiveIndex(prev => prev - 1);
    };

    const handleComplete = () => {
        onComplete?.(formData);
    };

    const renderStep = () => {
        switch (activeIndex) {
            case 0:
                return (
                    <BasicInfoStep
                        data={formData}
                        //call={call}
                        //constraints={constraints}
                        onUpdate={updateFormData}
                        onNext={handleNext}
                    />
                );
            case 1:
                return (
                    <CollaboratorsStep
                        data={formData}
                        onUpdate={updateFormData}
                        onNext={handleNext}
                        onBack={handleBack}
                        nextLabel="Next: Phases"
                        backLabel="Back to Info"
                    />
                );
            case 2:
                return (
                    <PhasesStep
                        data={formData}
                        onUpdate={updateFormData}
                        onNext={handleNext}
                        onBack={handleBack}
                        nextLabel="Next: Submission"
                        backLabel="Back to Team"
                    />
                );

            case 3:

                return (
                    <SubmissionStep
                        data={formData}
                        onComplete={handleComplete}
                        onBack={handleBack}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div className="apply-wizard">
            <Steps
                model={wizardSteps}
                activeIndex={activeIndex}
                className="mb-4"
            />
            <div className="min-h-20rem">
                {renderStep()}
            </div>
        </div>
    );
};

export default ApplyWizard;