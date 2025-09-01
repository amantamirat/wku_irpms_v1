import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { ProjectTheme } from "../../models/project.model";
import { CascadeSelect } from "primereact/cascadeselect";


interface AddThemeDialogProps {
    theme: ProjectTheme;
    setTheme: (theme: ProjectTheme) => void;
    options: any;
    visible: boolean;
    onAdd: () => void;
    onHide: () => void;
}

export default function AddThemeDialog({ theme, setTheme, options, visible, onAdd, onHide }: AddThemeDialogProps) {

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
            style={{ width: "90%", maxWidth: "400px" }}
            header="Add Theme"
            modal
            className="p-fluid"
            footer={footer}
            onHide={onHide}
        >
            <div className="card flex justify-content-center">
                <CascadeSelect
                    id="theme"
                    value={null}
                    options={options}
                    optionLabel="label"
                    optionGroupLabel="label"
                    optionGroupChildren={["children"]}
                    placeholder="Select a Theme"
                    scrollHeight="400px"
                    className="w-full md:w-14rem"
                    breakpoint="767px"
                    style={{ width: '100%' }}
                />
            </div>

        </Dialog>
    );
}
