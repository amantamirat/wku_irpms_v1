import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { ProjectTheme } from "../../models/project.model";
import { CascadeSelect } from "primereact/cascadeselect";
import { TreeSelect } from "primereact/treeselect";
import { useState } from "react";
import { Theme } from "@/app/(main)/themes/models/theme.model";


interface AddThemeDialogProps {
    theme: ProjectTheme;
    setTheme: (theme: ProjectTheme) => void;
    options: any;
    visible: boolean;
    onAdd: () => void;
    onHide: () => void;
}

export default function AddThemeDialog({ theme, setTheme, options, visible, onAdd, onHide }: AddThemeDialogProps) {

    const [selectedNode, setSelectedNode] = useState(null);
    
     const addTheme = () => {
        console.log(selectedNode);
        onAdd();
     }

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Add" icon="pi pi-check" text onClick={addTheme} />
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
                <label htmlFor="theme">Theme</label>
                <TreeSelect
                    id="theme"
                    value={selectedNode}
                    options={options}
                    onChange={(e) => setSelectedNode(e.value as any)}
                    placeholder="Select a Theme"
                    scrollHeight="400px"
                    className="w-full"
                    display="chip"
                />
            </div>

        </Dialog>
    );
}
