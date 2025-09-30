import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Steps } from "primereact/steps";
import { useState } from "react";
import { Call } from "../../calls/models/call.model";
import { Grant } from "../../grants/models/grant.model";
import CollaboratorManager from "../collaborators/components/CollaboratorManager";
import PhasesManager from "../components/phases/PhasesManager";
import ProjectForm from "../components/ProjectForm";
import ThemeManager from "../components/themes/ThemeManager";
import UploadDocumentStep from "../components/UploadDocumentStep";
import { Project } from "../models/project.model";


interface ApplyWizardProps {
    visible: boolean;
    call: Call;
    project: Project;
    setProject: (project: Project) => void;
    onHide: () => void;
}

export default function ApplyWizard({ visible, call, project, setProject, onHide: hideParent }: ApplyWizardProps) {
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
        hideParent();
    };

    const nextStep = () => setActiveStep(activeStep + 1);
    const prevStep = () => setActiveStep(activeStep - 1);

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
                <Button label="Submit" icon="pi pi-check" outlined />
            )}
        </div>
    );

    return (
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

            {activeStep === 0 && <UploadDocumentStep />}
            {activeStep === 1 && <ProjectForm project={project} setProject={setProject} />}
            {activeStep === 2 && <CollaboratorManager project={project} setProject={setProject}/>}
            {/**
             *            {activeStep === 3 && <ThemeManager project={project} setProject={setProject} />}
            {activeStep === 4 && <PhasesManager project={project} setProject={setProject} phaseType={PhaseType.phase} />}
 
             */}
        </Dialog>
    );
}
