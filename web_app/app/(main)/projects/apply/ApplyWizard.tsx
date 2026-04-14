'use client';
import { Steps } from 'primereact/steps';
import { useState } from 'react';
import { Call } from '../../calls/models/call.model';
import { Project } from '../models/project.model';
import { BasicInfoStep } from './steps/BasicInfoStep ';
import { PhasesStep } from './steps/PhasesStep';
import { CollaboratorsStep } from './steps/CollaboratorsStep';
import { SubmissionStep } from './steps/SubmissionStep';


interface ApplyWizardProps {
    call: Call;
    onComplete?: (data: any) => void;
}

const ApplyWizard = ({ call, onComplete }: ApplyWizardProps) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [formData, setFormData] = useState<Partial<Project>>({
        call: call._id,
        grantAllocation: typeof call.grantAllocation === 'object'
            ? (call.grantAllocation as any)._id
            : call.grantAllocation,
        title: '',
        summary: '',
        themes: [],
        phases: [{ title: '', order: 1, budget: 0, duration: 0, description: '' }]
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
                        onUpdate={updateFormData}
                        onNext={handleNext}
                    />
                );
            case 1:
                return (
                    <PhasesStep
                        data={formData}
                        onUpdate={updateFormData}
                        onNext={handleNext}
                        onBack={handleBack}
                    />
                );
            case 2:

                return (
                    <CollaboratorsStep
                        data={formData}
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