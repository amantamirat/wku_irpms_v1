import { useAuth } from "@/contexts/auth-context";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Steps } from "primereact/steps";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import { Applicant } from "../../applicants/models/applicant.model";
import { Call } from "../../calls/models/call.model";
import { Grant } from "../../grants/models/grant.model";
import { ProjectApi } from "../../projects/api/project.api";
import CollaboratorManager from "../../projects/collaborators/components/CollaboratorManager";
import { Collaborator } from "../../projects/collaborators/models/collaborator.model";
import UploadForm from "../../projects/components/UploadForm";
import { Project, ProjectStatus, validateApplyProject } from "../../projects/models/project.model";
import PhaseManager from "../../projects/phases/components/PhaseManager";
import { Phase, PhaseType } from "../../projects/phases/models/phase.model";
import ProjectThemeManager from "../../projects/themes/components/ThemeManager";
import { ProjectTheme } from "../../projects/themes/models/project.theme.model";
import { Theme } from "../../thematics/themes/models/theme.model";
import Confirmation from "./Confirmation";
import ProjectForm from "./ProjectForm";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";


interface ApplyWizardProps {
    visible: boolean;
    call: Call;
    onCancel: () => void;
}

const ApplyWizard = ({ visible, call, onCancel }: ApplyWizardProps) => {

    const confirm = useConfirmDialog();
    const { getApplicant } = useAuth();
    const applicant = getApplicant();
    const initializeProject = (): Project => ({
        title: "",
        call: call,
        applicant: applicant,
        status: ProjectStatus.pending
    });
    const toast = useRef<Toast>(null);
    const [loading, setLoading] = useState(false);
    const [project, setProject] = useState<Project>(initializeProject());

    useEffect(() => {
        if (visible) {
            setProject(initializeProject());
        }
    }, [visible, call]);

    const updateFile = (file: File) => {
        setProject({ ...project, ["file"]: file });
    }

    const addCollaborator = (collaborator: Collaborator) => {
        const applicant = collaborator.applicant as Applicant;
        if (!applicant || !applicant._id) {
            throw new Error("Please select a valid collaborator.");
        }
        const exists =
            project.collaborators?.some(
                (c) => (c.applicant as Applicant)._id === applicant._id
            ) ?? false;

        if (exists) {
            throw new Error("This collaborator is already added!");
        }
        const updatedCollaborators = [...(project.collaborators || []), collaborator];
        setProject({ ...project, collaborators: updatedCollaborators });
    };

    const removeCollaborator = (collaborator: Collaborator) => {
        const updatedCollaborators = project.collaborators?.filter(
            (c) => (c.applicant as Applicant)._id !== (collaborator.applicant as Applicant)._id
        ) || [];
        setProject({ ...project, collaborators: updatedCollaborators });
    };

    const savePhase = (phase: Phase) => {
        const phases = project.phases ?? [];
        const index = phases.findIndex(p => p.order === phase.order);

        const updatedPhases =
            index >= 0
                ? phases.map(p => p.order === phase.order ? phase : p)
                : [...phases, phase];

        setProject({ ...project, phases: updatedPhases });
    };

    const removePhase = (phase: Phase) => {
        const updatedPhases = project.phases?.filter(
            (p) => p.order !== phase.order
        ) || [];
        setProject({ ...project, phases: updatedPhases });
    };

    const addProjectTheme = (thm: ProjectTheme) => {
        const exists =
            project.themes?.some(
                (t) => (t.theme as Theme)._id === (thm.theme as Theme)._id
            ) ?? false;

        if (exists) {
            throw new Error("The theme is already added!");
        }
        const updated = [...(project.themes || []), thm];
        setProject({ ...project, themes: updated });
    };

    const removeProjectTheme = (thm: ProjectTheme) => {
        const updated = project.themes?.filter(
            (t) => (t.theme as Theme)._id !== (thm.theme as Theme)._id
        ) || [];
        setProject({ ...project, themes: updated });
    };

    const submit = async () => {
        try {
            setLoading(true);
            const result = validateApplyProject(project);
            if (!result.valid) {
                throw new Error(result.message);
            }
            const submitted = await ProjectApi.submitProject(project);
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: 'Your Application Submitted Successfully',
                life: 2500
            });
            setTimeout(() => onHide(), 1000);
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to submit project',
                detail: '' + err,
                life: 3000
            });
        }
        finally {
            setLoading(false);
        }
    };

    const [activeStep, setActiveStep] = useState(0);
    const items = [
        { label: 'Upload Document' },
        { label: 'Project Information' },
        { label: 'Collaborators' },
        { label: 'Themes' },
        { label: 'Phases' },
        { label: 'Confirmation' }
    ];

    const onHide = () => {
        setActiveStep(0);
        onCancel();
    };

    const nextStep = () => {
        setActiveStep(activeStep + 1);
    };
    const prevStep = () => {
        setActiveStep(activeStep - 1)
    };

    const footer = (
        <div className="flex justify-content-center gap-2">
            {activeStep === 0 && (
                <Button label="Cancel" icon="pi pi-times" severity="secondary" outlined onClick={onHide} />
            )}
            {activeStep > 0 && (
                <Button label="Back" icon="pi pi-angle-left" onClick={prevStep} outlined severity="secondary" />
            )}
            {activeStep < items.length - 1 && (<Button label="Next" icon="pi pi-angle-right" onClick={nextStep} iconPos="right" outlined />
            )}
            {activeStep === items.length - 1 && (
                <Button label="Submit" icon="pi pi-check" loading={loading}
                    outlined onClick={() => confirm.ask({
                        operation: "submit",
                        onConfirmAsync: () => submit()
                    })} />
            )}
        </div>
    );


    return (
        <>
            <Toast ref={toast} />
            <Dialog
                header="Apply for Call"
                visible={visible}
                style={{ width: '700px' }}
                footer={footer}
                onHide={onHide}
                maximized
            >
                <h3>{call.title} ({
                    (call.grant as Grant).title
                })</h3>
                <Steps model={items} activeIndex={activeStep} readOnly className="mb-4" />
                {activeStep === 0 && <UploadForm file={project.file} onUpload={updateFile} />}
                {activeStep === 1 && <ProjectForm project={project} setProject={setProject} />}
                {activeStep === 2 && <CollaboratorManager project={project} onSave={addCollaborator} onRemove={removeCollaborator} flyMode={true} />}
                {activeStep === 3 && <ProjectThemeManager project={project} onSave={addProjectTheme} onRemove={removeProjectTheme} flyMode={true} />}
                {activeStep === 4 && <PhaseManager project={project} phaseType={PhaseType.phase} flyMode={true} onSave={savePhase} onRemove={removePhase} />}
                {activeStep === items.length - 1 && <Confirmation project={project} call={project.call as Call} />}
            </Dialog>
        </>
    );
}

export default ApplyWizard;
