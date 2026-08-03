'use client';
import { Steps } from 'primereact/steps';
import { useState } from 'react';
import { Call } from '../../calls/models/call.model';
import { Project } from '../models/project.model';
import { SubmissionStep } from './steps/SubmissionStep';
import { useAuth } from '@/contexts/auth-context';
import { Constraint } from '../../grants/constraints/models/constraint.model';
import { BasicInfoStep } from '../components/newsteps/BasicInfoStep';
import { PhasesStep } from '../components/newsteps/PhasesStep';
import { CollaboratorsStep } from '../components/newsteps/CollaboratorsStep';


interface ApplyWizardProps {
    call: Call;
    constraints: Constraint[];
    onComplete?: (data: any) => void;
}

const ApplyWizard = ({ call, constraints, onComplete }: ApplyWizardProps) => {
    const { getUser } = useAuth();
    const appUser = getUser();
    const [activeIndex, setActiveIndex] = useState(0);
    const [formData, setFormData] = useState<Project>({
        call: call._id,
        title: '',
        summary: '',
        themes: [],
        leadPI: appUser?._id,
        collaborators: [{ member: appUser?._id, role: "Principal Investigator", isLeadPI: true }],
        phases: [{ title: 'Phase 1', order: 1, budget: 1000, duration: 10, description: '' }]
    });

    const wizardSteps = [
        { label: 'Basic Information' },
        { label: 'Budget & Phases' },
        { label: 'Collaborators' },
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
                        call={call}
                        //constraints={constraints}
                        onUpdate={updateFormData}
                        onNext={handleNext}
                    />
                );
            case 1:
                return (
                    <PhasesStep
                        data={formData}
                        //constraints={constraints}
                        onUpdate={updateFormData}
                        onNext={handleNext}
                        onBack={handleBack}
                    />
                );
            case 2:

                return (
                    <CollaboratorsStep
                        data={formData}
                        //constraints={constraints}
                        onUpdate={updateFormData}
                        onNext={handleNext}
                        onBack={handleBack}
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