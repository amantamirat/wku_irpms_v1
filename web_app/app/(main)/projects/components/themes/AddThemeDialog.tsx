import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { TreeSelect } from "primereact/treeselect";
import { ProjectTheme } from "../../models/project.model";
import { Dropdown } from "primereact/dropdown";


interface AddThemeDialogProps {
    projectTheme: ProjectTheme;
    setProjectTheme: (theme: ProjectTheme) => void;
    themeOptions: any;
    collaboratorOptions: any;
    visible: boolean;
    onAdd: () => void;
    onHide: () => void;
}

export default function AddThemeDialog({ projectTheme, setProjectTheme, themeOptions, collaboratorOptions, visible, onAdd, onHide }: AddThemeDialogProps) {



    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Add" icon="pi pi-check" text onClick={onAdd} />
        </>
    );

    return (
        <Dialog
            visible={visible}
            style={{ width: "90%", maxWidth: "400px" }}
            header="Add Theme"
            modal
            className="p-fluid"
            footer={footer}
            onHide={onHide}
        >
            <div className="field">
                <TreeSelect
                    id="theme"
                    value={projectTheme.theme as string}
                    options={themeOptions}
                    onChange={(e) => setProjectTheme({ ...projectTheme, theme: e.value as string })}
                    placeholder="Select a Theme"
                    scrollHeight="400px"
                    className="w-full"
                    display="chip"
                />
            </div>

            <div className="field">
                <Dropdown
                    id="copi"
                    value={projectTheme.Co_PI}
                    options={collaboratorOptions}
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
