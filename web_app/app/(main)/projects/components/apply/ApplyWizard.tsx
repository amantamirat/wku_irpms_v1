import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Steps } from "primereact/steps";
import { useRef, useState } from "react";
import { Call } from "../../../calls/models/call.model";
import { Grant } from "../../../grants/models/grant.model";
import CollaboratorManager from "../../collaborators/components/CollaboratorManager";
import ProjectForm from "../dialogs/ProjectForm";
import { Project, validateApplyProject } from "../../models/project.model";
import ProjectThemeManager from "../../themes/components/ThemeManager";
import { PhaseType } from "../../phases/models/phase.model";
import PhaseManager from "../../phases/components/PhaseManager";
import UploadForm from "../UploadForm";
import Confirmation from "./Confirmation";
import { ProjectApi } from "../../api/project.api";
import { Toast } from "primereact/toast";


interface ApplyWizardProps {
    visible: boolean;
    call: Call;
    project: Project;
    setProject: (project: Project) => void;
    onCancel: () => void;
}

const ApplyWizard = ({ visible, call, project, setProject, onCancel }: ApplyWizardProps) => {


    const toast = useRef<Toast>(null);
    const [loading, setLoading] = useState(false); 
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
        finally{
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

    const updateFile = (file: File) => {
        setProject({ ...project, ["file"]: file });
    }

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
                {activeStep === 2 && <CollaboratorManager project={project} setProject={setProject} />}
                {activeStep === 3 && <ProjectThemeManager project={project} setProject={setProject} />}
                {activeStep === 4 && <PhaseManager project={project} setProject={setProject} phaseType={PhaseType.phase} />}
                {activeStep === items.length - 1 && <Confirmation project={project} call={project.call as Call} />}
            </Dialog>
        </>
    );
}

export default ApplyWizard;
