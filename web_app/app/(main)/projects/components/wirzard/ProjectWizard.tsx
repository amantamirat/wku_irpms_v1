'use client';

import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Steps } from "primereact/steps";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";

import { EntitySaveDialogProps } from "@/components/createEntityManager";
import { useAuth } from "@/contexts/auth-context";
import { ProjectApi } from "../../api/project.api";
import { Project, validateProject } from "../../models/project.model";
import { BasicInfoStep } from "./BasicInfoStep";
import { CollaboratorsStep } from "./CollaboratorsStep";
import { PhasesStep } from "./PhasesStep";



const ProjectWizard = ({ item, onComplete, onHide, visible }: EntitySaveDialogProps<Project>) => {
    const toast = useRef<Toast>(null);
    const { getUser } = useAuth();
    const appUser = getUser();
    const isEditMode = !!item?._id;

    const createDefaultProject = (): Project => ({
        title: '',
        summary: '',
        themes: [],
        leadPI: appUser || '',
        collaborators: appUser
            ? [{
                member: appUser._id,
                role: "Principal Investigator",
                isLeadPI: true
            }]
            : [],
        phases: [{
            title: 'Phase 1',
            order: 1,
            budget: 1000,
            duration: 10,
            description: ''
        }]
    });

    // --- Core Wizard States ---
    const [activeIndex, setActiveIndex] = useState(0);
    //const [constraints, setConstraints] = useState<Constraint[]>([]);
    const [submitted, setSubmitted] = useState(false);

    const [formData, setFormData] = useState<Project>(
        createDefaultProject()
    );



    const wizardSteps = [
        { label: 'Basic Information' },
        { label: 'Budget & Phases' },
        { label: 'Collaborators' }
    ];

    // --- Hydrate Form State Reactively ---
    useEffect(() => {
        if (!visible) return;

        setFormData(
            item?._id
                ? {
                    ...item,
                    title: item.title || '',
                    summary: item.summary || '',
                    themes: item.themes || [],
                    collaborators: item.collaborators || [],
                    phases: item.phases || []
                }
                : createDefaultProject()
        );
        setActiveIndex(0);
        setSubmitted(false);
    }, [item, visible, appUser]);

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

            //console.log(formData);

            const saved = await ProjectApi.create(formData);

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Project created successfully',
                life: 2000
            });

            setTimeout(() => {
                if (onComplete) {
                    onComplete({
                        ...saved,
                        leadPI: formData.leadPI,
                        grant: formData.grant
                    });
                }

                onHide();
            }, 2000);
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
                leadPI: formData.leadPI,
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