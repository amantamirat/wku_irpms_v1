import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Steps } from "primereact/steps";
import { useEffect, useRef, useState } from "react";
import { Grant } from "../../grants/models/grant.model";
import CollaboratorManager from "../../projects/collaborators/components/CollaboratorManager";
import ProjectForm from "./ProjectForm";
import { Project, validateApplyProject } from "../../projects/models/project.model";
import ProjectThemeManager from "../../projects/themes/components/ThemeManager";
import { PhaseType } from "../../projects/phases/models/phase.model";
import PhaseManager from "../../projects/phases/components/PhaseManager";
import UploadForm from "../../projects/components/UploadForm";
import Confirmation from "./Confirmation";
import { ProjectApi } from "../../projects/api/project.api";
import { Toast } from "primereact/toast";
import { useAuth } from "@/contexts/auth-context";
import { Collaborator, CollaboratorStatus } from "../../projects/collaborators/models/collaborator.model";
import { Applicant } from "../../applicants/models/applicant.model";
import { Call } from "../../calls/models/call.model";


interface ApplyWizardProps {
    visible: boolean;
    call: Call;
    onCancel: () => void;
}

const ApplyWizard = ({ visible, call, onCancel }: ApplyWizardProps) => {
    //const { user } = useAuth();
    const { getLinkedApplicant } = useAuth();
    const linkedApplicant = getLinkedApplicant();
    const initializeProject = (): Project => ({
        title: "",
        call: call,
        leadPI:linkedApplicant
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

    const addCollaborator = (savedCollaborator: Collaborator) => {
        const applicant = savedCollaborator.applicant as Applicant;
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
        const updatedCollaborators = [...(project.collaborators || []), savedCollaborator];
        setProject({ ...project, collaborators: updatedCollaborators });
    };

    const removeCollaborator = (collaborator:Collaborator) => {
        const updatedCollaborators = project.collaborators?.filter(
            (c) => (c.applicant as Applicant)._id !== (collaborator.applicant as Applicant)._id
        ) || [];
        setProject({ ...project, collaborators: updatedCollaborators });        
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
            setTimeout(() => onHide(), 2500);
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
                <Button label="Submit" icon="pi pi-check" loading={loading} outlined onClick={submit} />
            )}
        </div>
    );





    return (
        <>
            <Toast ref={toast} />
            <Dialog
                header="Apply for Call"
                visible={visible}
                style={{ width: '700px', height: '600px' }}
                footer={footer}
                onHide={onHide}
                maximizable
            >
                <h3>{call.title} ({(call.grant as Grant).title})</h3>
                <Steps model={items} activeIndex={activeStep} readOnly className="mb-4" />
                {activeStep === 0 && <UploadForm file={project.file} onUpload={updateFile} />}
                {activeStep === 1 && <ProjectForm project={project} setProject={setProject} />}
                {activeStep === 2 && <CollaboratorManager project={project} onSave={addCollaborator} flyMode />}
                {activeStep === 3 && <ProjectThemeManager project={project} setProject={setProject} />}
                {activeStep === 4 && <PhaseManager project={project} setProject={setProject} phaseType={PhaseType.phase} />}
                {activeStep === items.length - 1 && <Confirmation project={project} call={project.call as Call} />}
            </Dialog>
        </>
    );
}

export default ApplyWizard;
