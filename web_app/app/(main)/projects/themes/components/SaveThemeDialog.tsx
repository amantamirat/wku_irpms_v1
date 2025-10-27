import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { TreeSelect } from "primereact/treeselect";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import { ProjectTheme, validateProjectTheme } from "../models/project.theme.model";
import { Project } from "../../models/project.model";
import { Theme, ThemeType } from "@/app/(main)/themes/models/theme.model";
import { Call } from "@/app/(main)/calls/models/call.model";
import { ThemeApi } from "@/app/(main)/themes/api/theme.api";

type Node = {
    key?: string;
    label: string;
    value?: any;
    icon?: string;
    children?: Node[];
};


function buildTree(themes: Theme[], parentId?: string): Node[] {
    return themes
        .filter(t => {
            if (parentId) {
                return (t.parent ?? null) === parentId;
            }
            return t.type === ThemeType.broadTheme;
        })
        .map(t => {
            const children = buildTree(themes, t._id!);
            return {
                key: t._id,
                label: t.title,
                value: t,
                ...(children.length > 0
                    ? { children, selectable: false }
                    : { selectable: true })
            };
        });
}

interface SaveThemeDialogProps {
    project: Project;
    projectTheme: ProjectTheme;
    setProjectTheme: (theme: ProjectTheme) => void;
    visible: boolean;
    onSave?: () => Promise<void>;
    onAdd?: () => void;
    onHide: () => void;
}


export default function SaveThemeDialog({ project, projectTheme, setProjectTheme, visible, onSave, onAdd, onHide }: SaveThemeDialogProps) {

    const toast = useRef<Toast>(null);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();
    const [nodes, setNodes] = useState([]);
    const [themes, setThemes] = useState<Theme[]>([]);


    useEffect(() => {
        const fetchThemes = async () => {
            const theme = (project.call as Call).theme;
            const catalogId =
                typeof theme === "object" && theme !== null
                    ? (theme as any)._id
                    : theme;
            const data = await ThemeApi.getThemes({
                thematic_area: catalogId
            });
            setThemes(data);
            const node = buildTree(data);
            setNodes(node as any);
        };
        fetchThemes();
    }, [project?.call]);

    const addProjectTheme = async () => {
        try {
            const result = validateProjectTheme(projectTheme);
            if (!result.valid) {
                setErrorMessage(result.message);
                return;
            }
            setErrorMessage(undefined);
            const theme = themes.find((thm) => thm._id === (projectTheme.theme as string));
            if (!theme) {
                throw new Error("Theme not found!");
            }
            projectTheme.theme = theme;
            if (onSave) {
                await onSave();
            }
            if (onAdd) {
                onAdd();
            }
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
                        options={nodes}
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
