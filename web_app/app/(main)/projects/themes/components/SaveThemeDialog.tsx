'use client';
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { TreeSelect } from "primereact/treeselect";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";

import { ProjectTheme, validateProjectTheme } from "../models/project.theme.model";
import { ProjectThemeApi } from "../api/project.theme.api";
import { Project } from "../../models/project.model";
import { Theme } from "@/app/(main)/thematics/themes/models/theme.model";
import { ThemeApi } from "@/app/(main)/thematics/themes/api/theme.api";
import { Thematic } from "@/app/(main)/thematics/models/thematic.model";

type Node = {
    key?: string;
    label: string;
    value?: any;
    children?: Node[];
    selectable?: boolean;
};

// -------------------------------
// Build Theme Tree
// -------------------------------
const buildTree = (themes: Theme[], parentId?: string): Node[] => {
    return themes
        .filter(t => {
            if (!parentId) {
                // root nodes (level 0 OR no parent)
                return !t.parent;
            }
            // child nodes
            return typeof t.parent === "object"
                ? t.parent._id === parentId
                : t.parent === parentId;
        })
        .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
        .map(t => {
            const children = buildTree(themes, t._id);
            return {
                key: t._id,
                label: t.title,
                value: t._id,
                selectable: children.length === 0,
                ...(children.length > 0 ? { children } : {})
            };
        });
};


interface SaveThemeDialogProps {
    project?: Project;
    projectTheme: ProjectTheme;
    visible: boolean;
    thematic?: Thematic | string;
    onSave?: (saved: ProjectTheme) => void;
    onComplete?: (saved: ProjectTheme) => void;
    onHide: () => void;
}

const SaveThemeDialog = ({
    //project,
    projectTheme,
    visible,
    thematic,
    onSave,
    onComplete,
    onHide
}: SaveThemeDialogProps) => {

    const toast = useRef<Toast>(null);

    const [localProjectTheme, setLocalProjectTheme] = useState<ProjectTheme>({ ...projectTheme });
    const [themes, setThemes] = useState<Theme[]>([]);
    const [nodes, setNodes] = useState<Node[]>([]);

    // -------------------------------
    // Fetch themes
    // -------------------------------
    useEffect(() => {
        const fetchThemes = async () => {
            const data = await ThemeApi.getAll({
                thematicArea: thematic
            });
            setThemes(data);
            setNodes(buildTree(data));
        };

        fetchThemes();
    }, [thematic]);

    // -------------------------------
    // Reset on open
    // -------------------------------
    useEffect(() => {
        if (visible) {
            setLocalProjectTheme({ ...projectTheme });
        }
    }, [visible, projectTheme]);

    // -------------------------------
    // Save Theme
    // -------------------------------
    const saveTheme = async () => {
        try {
            const validation = validateProjectTheme(localProjectTheme);
            if (!validation.valid) {
                throw new Error(validation.message);
            }

            let saved: ProjectTheme;

            if (onSave) {
                saved = { ...localProjectTheme, theme: themes.find(t => t._id === localProjectTheme.theme)! };
                //console.log("calling onsave");
                onSave(saved);
            } else {
                if (localProjectTheme._id) {
                    //saved = await ProjectThemeApi.updateProjectTheme(localProjectTheme);
                    return;
                } else {
                    saved = await ProjectThemeApi.create(localProjectTheme);
                }
                saved = {
                    ...saved,
                    //project: project,
                    theme: themes.find(t => t._id === saved.theme) ?? saved.theme
                };
            }
            //console.log("from dialog", saved);
            toast.current?.show({
                severity: "success",
                summary: "Successful",
                detail: "Project theme saved successfully",
                life: 2000
            });

            if (onComplete) onComplete(saved);
        } catch (err) {
            toast.current?.show({
                severity: "error",
                summary: "Failed to save project theme",
                detail: String(err),
                life: 2500
            });
        }
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Save" icon="pi pi-check" text onClick={saveTheme} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: "600px" }}
                header="Project Theme"
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
            >
                <div className="field">
                    <label htmlFor="theme">Theme</label>
                    <TreeSelect
                        id="theme"
                        value={localProjectTheme.theme as string}
                        options={nodes}
                        onChange={(e) =>
                            setLocalProjectTheme({
                                ...localProjectTheme,
                                theme: e.value ? String(e.value) : ""
                            })
                        }
                        placeholder="Select a Theme"
                        scrollHeight="400px"
                        className="w-full"
                        display="chip"
                    />
                </div>
            </Dialog>
        </>
    );
};

export default SaveThemeDialog;
