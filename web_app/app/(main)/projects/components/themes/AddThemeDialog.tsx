import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { ProjectTheme } from "../../models/project.model";


interface AddThemeDialogProps {
    theme: ProjectTheme;
    setTheme: (theme: ProjectTheme) => void;
    visible: boolean;
    onAdd: () => void;
    onHide: () => void;
}

export default function AddThemeDialog({ theme, setTheme, visible, onAdd, onHide }: AddThemeDialogProps) {

    const updateField = (field: keyof ProjectTheme, value: any) => {
        setTheme({ ...theme, [field]: value });
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Add" icon="pi pi-check" text onClick={onAdd} />
        </>
    );

    return (
        <Dialog
            visible={visible}
            style={{ width: "600px" }}
            header="Add Theme"
            modal
            className="p-fluid"
            footer={footer}
            onHide={onHide}
        >
            <div className="field">
                
            </div>
        </Dialog>
    );
}
