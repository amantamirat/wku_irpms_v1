import ConfirmDialog from "@/components/ConfirmationDialog";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Toolbar } from "primereact/toolbar";
import { useEffect, useState } from "react";
import { Project } from "../../models/project.model";
import { ProjectThemeApi } from "../api/project.theme.api";
import { ProjectTheme } from "../models/project.theme.model";
import SaveThemeDialog from "./SaveThemeDialog";
import { Theme } from "@/app/(main)/thematic_areas/models/theme.model";

interface ProjectInfoStepProps {
    project: Project;
    setProject?: (project: Project) => void;
}

export default function ProjectThemeManager({ project, setProject }: ProjectInfoStepProps) {

    const emptyProjectTheme: ProjectTheme = {
        theme: "",
        project: project
    };

    const [projectTheme, setProjectTheme] = useState<ProjectTheme>(emptyProjectTheme);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [projectThemes, setProjectThemes] = useState<ProjectTheme[]>([]);

    useEffect(() => {
        const fetchProjectThemes = async () => {
            try {
                const data = await ProjectThemeApi.getProjectThemes({ project: project._id });
                setProjectThemes(data);
            } catch (err) {
                console.error("Failed to fetch project themes:", err);
            }
        };
        if (project?._id) {
            fetchProjectThemes();
        }
        else {
            setProjectThemes(project.themes ?? []);
        }
    }, [project?._id]);


    const saveProjectTheme = async () => {
        let _projectThemes = [...projectThemes];
        if (projectTheme._id) {
            const updated = await ProjectThemeApi.updateProjectTheme(projectTheme);
            const index = _projectThemes.findIndex((p) => p._id === updated._id);
            _projectThemes[index] = { ...updated, project: project, theme: projectTheme.theme };
        } else {
            const created = await ProjectThemeApi.createProjectTheme(projectTheme);
            _projectThemes.push({ ...created, project: project, theme: projectTheme.theme });
        }
        setProjectThemes(_projectThemes);
        hideDialogs();
    };

    const deleteProjectTheme = async () => {
        const deleted = await ProjectThemeApi.deleteProjectTheme(projectTheme);
        if (deleted) {
            setProjectThemes(projectThemes.filter((pt) => pt._id !== projectTheme._id));
            hideDialogs();
        }
    };

    const addProjectTheme = () => {
        const exists =
            project.themes?.some(
                (c) => (c.theme as Theme)._id === (projectTheme.theme as Theme)._id
            ) ?? false;
        if (exists) {
            throw new Error("The theme is already added!");
        }
        const updatedProjectThemes = [...(project.themes || []), projectTheme];
        if (setProject) {
            setProject({ ...project, themes: updatedProjectThemes });
        }
        setProjectThemes(updatedProjectThemes);
        hideDialogs();
    };

    const removeProjectTheme = () => {
        const updatedCollaborators = project.themes?.filter(
            (c) => (c.theme as Theme)._id !== (projectTheme.theme as Theme)._id
        ) || [];

        if (setProject) {
            setProject({ ...project, themes: updatedCollaborators });
        }
        setProjectThemes(updatedCollaborators);
        hideDialogs();
    };

    const hideDialogs = () => {
        setProjectTheme(emptyProjectTheme);
        setShowSaveDialog(false);
        setShowDeleteDialog(false);
    }

    const actionBodyTemplate = (rowData: ProjectTheme) => (
        <>
            <Button icon="pi pi-times" rounded severity="warning" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setProjectTheme(rowData);
                    setShowDeleteDialog(true);
                }} />
        </>
    );

    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button icon="pi pi-plus" severity="success" className="mr-2" tooltip={"Add Theme"}
                onClick={() => {
                    setProjectTheme(emptyProjectTheme);
                    setShowSaveDialog(true);
                }}
            />
        </div>
    );

    return (
        <div className="card">
            <Toolbar className="mb-4" start={startToolbarTemplate} />
            <DataTable
                value={projectThemes}
                selection={projectTheme}
                onSelectionChange={(e) => setProjectTheme(e.value as ProjectTheme)}
                dataKey="theme._id"
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 25]}
                className="datatable-responsive"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                emptyMessage={'No theme found.'}
                scrollable
                tableStyle={{ minWidth: '50rem' }}
            >
                <Column selectionMode="single" headerStyle={{ width: '3em' }}></Column>
                <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                <Column field="theme.title" header="Theme" sortable headerStyle={{ minWidth: '15rem' }} />
                <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }} />
            </DataTable>


            {projectTheme && (
                <SaveThemeDialog
                    project={project}
                    projectTheme={projectTheme}
                    setProjectTheme={setProjectTheme}
                    visible={showSaveDialog}
                    onSave={project._id ? saveProjectTheme : undefined}
                    onAdd={!project._id ? addProjectTheme : undefined}
                    onHide={hideDialogs} />
            )}
            {projectTheme && (
                <ConfirmDialog
                    showDialog={showDeleteDialog}
                    item={String((projectTheme.theme as any).title)}
                    onConfirmAsync={project._id ? deleteProjectTheme : undefined}
                    onConfirm={!project._id ? removeProjectTheme : undefined}
                    onHide={hideDialogs}
                />
            )}
        </div>
    )
}
