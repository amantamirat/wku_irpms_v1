import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { TreeSelect } from "primereact/treeselect";


interface AddThemeDialogProps {
    selectedNode: string;
    setSelectedNode: (theme: string) => void;
    options: any;
    visible: boolean;
    onAdd: () => void;
    onHide: () => void;
}

export default function AddThemeDialog({ selectedNode, setSelectedNode, options, visible, onAdd, onHide }: AddThemeDialogProps) {
    
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
