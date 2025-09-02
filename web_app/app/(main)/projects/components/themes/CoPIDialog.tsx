import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Collaborator, Project, ProjectTheme } from "../../models/project.model";
import { useState } from "react";


interface CoPIDialogProps {
    project: Project;
    projectTheme: ProjectTheme;
    setProjectTheme: (theme: ProjectTheme) => void;
    visible: boolean;
    onSet: () => void;
    onHide: () => void;
}

export default function CoPIDialog({ project, projectTheme, setProjectTheme, visible, onSet, onHide }: CoPIDialogProps) {


    const [coPI, setCoPI] = useState<Collaborator>();


    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Set" icon="pi pi-check" text onClick={onSet} />
        </>
    );

    return (
        <Dialog
            visible={visible}
            style={{ width: "90%", maxWidth: "400px" }}
            header="Co-PI"
            modal
            className="p-fluid"
            footer={footer}
            onHide={onHide}
        >
            <div className="field">
                <Dropdown
                    id="copi"
                    value={coPI}
                    options={project.collaborators}
                    onChange={(e) => setCoPI(e.value as any)}
                    optionLabel="applicant.full_name"
                    placeholder="Select Co PI"
                    scrollHeight="400px"
                    className="w-full"
                />
            </div>
        </Dialog>
    );
}
