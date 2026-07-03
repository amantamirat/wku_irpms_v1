'use client';

import { useEffect, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Steps } from "primereact/steps";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";

import { useAuth } from "@/contexts/auth-context";
import { EntitySaveDialogProps } from "@/components/createEntityManager";
import { Project, validateProject } from "../models/project.model";
import { Constraint } from "../../grants/constraints/models/constraint.model";
import { BasicInfoStep } from "./steps/BasicInfoStep";
import { PhasesStep } from "../apply/steps/PhasesStep";
import { CollaboratorsStep } from "../apply/steps/CollaboratorsStep";
import { ProjectApi } from "../api/project.api";

const ProjectWizard = ({ item, onComplete, onHide, visible }: EntitySaveDialogProps<Project>) => {
    const toast = useRef<Toast>(null);
    const { getUser } = useAuth();
    const activeAppUser = getUser();

    const isEditMode = !!item?._id;

    // --- Core Wizard States ---
    const [activeIndex, setActiveIndex] = useState(0);
    const [constraints, setConstraints] = useState<Constraint[]>([]);
    const [submitted, setSubmitted] = useState(false);

    const [formData, setFormData] = useState<Project>({
        title: '',
        summary: '',
        themes: [],
        collaborators: [{ applicant: activeAppUser as any, role: "Principal Investigator", isLeadPI: true }],
        phases: [{ title: '', order: 1, budget: 0, duration: 0, description: '' }]
    });

    const wizardSteps = [
        { label: 'Basic Information' },
        { label: 'Budget & Phases' },
        { label: 'Collaborators' }
    ];

    // --- Hydrate Form State Reactively ---
    useEffect(() => {
        if (visible) {
            setFormData({
                ...item,
                title: item?.title || '',
                summary: item?.summary || '',
                themes: item?.themes || [],
                collaborators: item?.collaborators || [{ applicant: activeAppUser as any, role: "Principal Investigator", isLeadPI: true }],
                phases: item?.phases || [{ title: '', order: 1, budget: 0, duration: 0, description: '' }]
            });
            setActiveIndex(0);
            setSubmitted(false);
        }
    }, [item, visible, activeAppUser]);

    const updateFormData = (data: Partial<Project>) => {
        setFormData(prev => ({ ...prev, ...data }));
    };

    const handleNext = () => {
        setActiveIndex(prev => prev + 1);
    };

    const handleBack = () => {
        setActiveIndex(prev => prev - 1);
    };

    // --- Create / Save Handler for Wizard Context Flow ---
    const handleSaveSubmit = async () => {
        setSubmitted(true);
        try {
            const validation = validateProject(formData);
            if (!validation.valid) throw new Error(validation.message);

            const saved = await ProjectApi.createFromGrant(formData);

            toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Project created successfully' });
            if (onComplete) onComplete({
                ...saved,
                applicant: formData.applicant,
                grant: formData.grant
            });
            onHide();
        } catch (err: any) {
            toast.current?.show({ severity: 'error', summary: 'Submission Error', detail: err.message });
        }
    };

    // --- Update Handler Exclusively Targeted for Edit Mode Core Alteration ---
    const handleUpdateSubmit = async () => {
        setSubmitted(true);
        try {
            if (!formData.title || !formData.themes || formData.themes.length === 0) {
                throw new Error("Please complete the required Title and Theme configurations.");
            }

            const saved = await ProjectApi.update(formData);

            toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Project updated successfully' });
            if (onComplete) onComplete({
                ...saved,
                applicant: formData.applicant,
                grant: formData.grant
            });
            onHide();
        } catch (err: any) {
            toast.current?.show({ severity: 'error', summary: 'Update Error', detail: err.message });
        }
    };

    const renderStep = () => {
        switch (activeIndex) {
            case 0:
                return (
                    <BasicInfoStep
                        data={formData}
                        onUpdate={updateFormData}
                        onConstraintsChange={setConstraints}
                        onNext={handleNext}
                    />
                );
            case 1:
                return (
                    <PhasesStep
                        data={formData}
                        constraints={constraints}
                        onUpdate={updateFormData}
                        onNext={handleNext}
                        onBack={handleBack}
                    />
                );
            case 2:
                return (
                    <CollaboratorsStep
                        data={formData}
                        constraints={constraints}
                        onUpdate={updateFormData}
                        onNext={handleSaveSubmit}
                        onBack={handleBack}
                    />
                );
            default:
                return null;
        }
    };

    // --- Dynamic Inline Dialog Footer Built Specifically For Edit Mode UI Rendering ---
    const editModeFooter = isEditMode ? (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Save Changes" icon="pi pi-check" onClick={handleUpdateSubmit} className="w-auto px-4" />
        </>
    ) : undefined;

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '750px' }}
                header={isEditMode ? 'Edit Project' : 'New Project'}
                modal
                className="p-fluid"
                onHide={onHide}
                footer={editModeFooter}
                maximizable
                maximized
            >
                <div className="project-wizard pt-2">
                    {isEditMode ? (
                        /* Edit Mode Layout Context Container */
                        <div className="min-h-20rem mt-2">
                            <BasicInfoStep
                                data={formData}
                                onUpdate={updateFormData}
                                onConstraintsChange={setConstraints}
                                onNext={() => { }} // Block navigation out of Basic Info block during edit states
                                isEditModeOnly={true} // Extracted variable flag configuration reference
                            />
                        </div>
                    ) : (
                        /* Standard Wizard Creation Container Flow */
                        <>
                            <Steps
                                model={wizardSteps}
                                activeIndex={activeIndex}
                                className="mb-5"
                                onSelect={(e) => {
                                    if (e.index < activeIndex) {
                                        setActiveIndex(e.index);
                                    }
                                }}
                            />
                            <div className="min-h-20rem">
                                {renderStep()}
                            </div>
                        </>
                    )}
                </div>
            </Dialog>
        </>
    );
};

export default ProjectWizard;