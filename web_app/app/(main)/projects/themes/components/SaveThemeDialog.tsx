import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { TreeSelect } from "primereact/treeselect";
import { Toast } from "primereact/toast";
import { useRef, useState } from "react";
import { ProjectTheme, validateProjectTheme } from "../models/project.theme.model";


interface SaveThemeDialogProps {
    projectTheme: ProjectTheme;
    setProjectTheme: (theme: ProjectTheme) => void;
    themeOptions: any;
    visible: boolean;
    onAdd: () => Promise<void>;
    onHide: () => void;
}

export default function SaveThemeDialog({ projectTheme, setProjectTheme, themeOptions, visible, onAdd, onHide }: SaveThemeDialogProps) {

    const toast = useRef<Toast>(null);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();

    const addProjectTheme = async () => {
        try {
            const result = validateProjectTheme(projectTheme);
            if (!result.valid) {
                setErrorMessage(result.message);
                return;
            }
            setErrorMessage(undefined);
            await onAdd();
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: "[Project Theme Saved]",
                life: 2000
            });
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to save project theme',
                detail: '' + err,
                life: 3000
            });
        }
    }


    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Add" icon="pi pi-check" text onClick={addProjectTheme} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: "90%", maxWidth: "400px" }}
                header="Project Theme"
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
                {errorMessage && (
                    <small className="p-error">{errorMessage}</small>
                )}
            </Dialog>
        </>
    );
}
