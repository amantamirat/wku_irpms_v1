'use client';

import { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable, DataTableFilterMeta } from "primereact/datatable";
import { Toolbar } from "primereact/toolbar";
import ConfirmDialog from "@/components/ConfirmationDialog";
import SaveProjectStageDialog from "./SaveProjectStageDialog";
import { Project } from "../../models/project.model";
import { ProjectStage, StageStatus } from "../models/stage.model";
import { BASE_URL } from "@/api/ApiClient";
import ReviewerManager from "../../reviewers/components/ReviewerManager";
import { ProjectStageApi } from "../api/project.stage.api";
import { Stage } from "@/app/(main)/cycles/stages/models/stage.model";
import Badge from "@/templates/Badge";
import { InputText } from "primereact/inputtext";
import { handleGlobalFilterChange, initFilters } from "@/utils/filterUtils";

interface ProjectStageManagerProps {
    project?: Project;
    stage?: Stage;
    setProject?: (project: Project) => void;
}

const ProjectStageManager = ({ project, stage, setProject }: ProjectStageManagerProps) => {
    const emptyProjectStage: ProjectStage = {
        project: project ? project : "",
        stage: "",
        status: StageStatus.pending,
    };

    const [stages, setStages] = useState<ProjectStage[]>([]);
    const [projectStage, setProjectStage] = useState<ProjectStage>(emptyProjectStage);
    const [showDialog, setShowDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };

    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
    }, []);

    // ✅ Fetch stages from backend if project exists
    useEffect(() => {
        const fetchProjectStages = async () => {
            try {
                if (project?._id || stage?._id) {
                    const data = await ProjectStageApi.getProjectStages({ project: project?._id, stage: stage?._id });
                    setStages(data);
                }
            } catch (err) {
                console.error("Failed to fetch project stages:", err);
            }
        };
        fetchProjectStages();
    }, [project?._id, stage?._id]);

    // ✅ Called after saving (either create or update)
    const onSaveComplete = (savedStage: ProjectStage) => {
        const existingIndex = stages.findIndex((s) => s._id === savedStage._id);
        const updated = existingIndex !== -1
            ? stages.map((s, i) => (i === existingIndex ? savedStage : s))
            : [...stages, savedStage];
        setStages(updated);
        hideDialogs();
    };

    /*
    // ✅ For local unsaved projects
    const addProjectStage = (savedStage: ProjectStage) => {
        const exists = stages?.some((s) => s.stage === savedStage.stage);
        if (exists) {
            throw new Error("This stage is already added!");
        }
        const updatedStages = [...(project.stages || []), savedStage];
        if (setProject) setProject({ ...project, stages: updatedStages });
        hideDialogs();
    };
    */

    // ✅ Delete handler
    const deleteProjectStage = async () => {
        if (project?._id) {
            const deleted = await ProjectStageApi.deleteProjectStage(projectStage);
            if (deleted) {
                setStages(stages.filter((s) => s._id !== projectStage._id));
            }
        } else {
            /*
            const updated = project.stages?.filter((s) => s.stage !== saved.stage) || [];
            if (setProject) setProject({ ...project, stages: updated });
            */
        }
        hideDialogs();
    };

    // ✅ Hide dialogs and reset state
    const hideDialogs = () => {
        setProjectStage(emptyProjectStage);
        setShowDialog(false);
        setShowDeleteDialog(false);
    };

    // ✅ Toolbar for adding a new stage
    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button
                icon="pi pi-plus"
                severity="success"
                className="mr-2"
                tooltip="Add Project Stage"
                onClick={() => {
                    setProjectStage(emptyProjectStage);
                    setShowDialog(true);
                }}
            />
        </div>
    );

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"> {project ? "Stages" : stage ? "Projects" : "Project Stages"}</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" value={globalFilter} onChange={onGlobalFilterChange} placeholder="Search..." className="w-full md:w-1/3" />
            </span>
        </div>
    );

    // ✅ Action buttons for each row
    const actionBodyTemplate = (rowData: ProjectStage) => (
        <>
            <Button
                icon="pi pi-pencil"
                rounded
                severity="success"
                className="p-button-rounded p-button-text"
                style={{ fontSize: "1.2rem" }}
                onClick={() => {
                    setProjectStage(rowData);
                    setShowDialog(true);
                }}
            />
            <Button
                icon="pi pi-times"
                rounded
                severity="warning"
                className="p-button-rounded p-button-text"
                style={{ fontSize: "1.2rem" }}
                onClick={() => {
                    setProjectStage(rowData);
                    setShowDeleteDialog(true);
                }}
            />
        </>
    );

    // ✅ Column for viewing uploaded document
    const documentBodyTemplate = (rowData: ProjectStage) => {
        if (!rowData.documentPath) return "No document";
        const url = `${BASE_URL}/${rowData.documentPath.replace(/^\\/, "")}`;
        return (
            <Button
                label="View"
                icon="pi pi-eye"
                className="p-button-text"
                onClick={() => window.open(url, "_blank")}
            />
        );
    };

    const statusBodyTemplate = (rowData: ProjectStage) => {
        return (
            <Badge type="status" value={rowData.status ?? 'Unknown'} />
        );
    };

    return (
        <div className="card">
            {project &&
                <Toolbar className="mb-4" start={startToolbarTemplate} />
            }
            <DataTable
                value={stages}
                header={header}
                selection={projectStage}
                onSelectionChange={(e) => setProjectStage(e.value as ProjectStage)}
                dataKey={stages.some((s) => s._id) ? "_id" : "stage"}
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 25]}
                className="datatable-responsive"
                emptyMessage="No project stages found."
                globalFilter={globalFilter}
                filters={filters}
                scrollable
            //tableStyle={{ minWidth: "50rem" }}
            >
                {
                    //<Column expander style={{ width: "3em" }} />
                }
                <Column selectionMode="single" headerStyle={{ width: '3em' }} />
                <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: "50px" }} />
                {!stage && <Column field="stage.name" header="Stage" sortable />}
                {!project && <Column field="project.title" header="Project" sortable />}
                <Column header="Document" body={documentBodyTemplate} />
                <Column header="Status" body={statusBodyTemplate} sortable />
                <Column body={actionBodyTemplate} headerStyle={{ minWidth: "10rem" }} />
            </DataTable>

            {(projectStage && project) &&
                <SaveProjectStageDialog
                    project={project}
                    projectStage={projectStage}
                    visible={showDialog}
                    //onSave={!project._id ? addProjectStage : undefined}
                    onComplete={onSaveComplete}
                    onHide={hideDialogs}
                />
            }

            {(projectStage && project) && (
                <ConfirmDialog
                    showDialog={showDeleteDialog}
                    title={projectStage.stage ? projectStage.stage.toString() : "Project Stage"}
                    onConfirmAsync={project?._id ? deleteProjectStage : undefined}
                    onConfirm={!project?._id ? deleteProjectStage : undefined}
                    onHide={hideDialogs}
                />
            )}
        </div>
    );
}

export default ProjectStageManager;