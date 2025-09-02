import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { ProjectTheme } from "../../models/project.model";


interface CoPIDialogProps {
    projectTheme: ProjectTheme;
    setProjectTheme: (theme: ProjectTheme) => void;
    options: any;
    visible: boolean;
    onAdd: () => void;
    onHide: () => void;
}

export default function CoPIDialog({ projectTheme, setProjectTheme, options, visible, onAdd, onHide }: CoPIDialogProps) {


    
    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Set" icon="pi pi-check" text onClick={onAdd} />
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
                    value={projectTheme.Co_PI}
                    options={options}
                    onChange={(e) => setProjectTheme({ ...projectTheme, Co_PI: e.value })}
                    optionLabel="applicant.full_name"
                    placeholder="Select Co PI"
                    scrollHeight="400px"
                    className="w-full"
                />
            </div>
        </Dialog>
    );
}
