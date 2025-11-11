'use client';

import { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Toolbar } from "primereact/toolbar";
import ConfirmDialog from "@/components/ConfirmationDialog";
import SaveProjectStageDialog from "./SaveProjectStageDialog";
import { Project } from "../../models/project.model";
import { ProjectStage, StageStatus } from "../models/stage.model";
import { BASE_URL } from "@/api/ApiClient";
import ReviewerManager from "../../reviewers/components/ReviewerManager";
import { ProjectStageApi } from "../api/stage.api";

interface ProjectStageManagerProps {
    project: Project;
    setProject?: (project: Project) => void;
}

export default function ProjectStageManager({ project, setProject }: ProjectStageManagerProps) {
    const emptyProjectStage: ProjectStage = {
        project: project,
        stage: "",
        status: StageStatus.pending,
    };

    const [stages, setStages] = useState<ProjectStage[]>([]);
    const [saved, setStage] = useState<ProjectStage>(emptyProjectStage);
    const [showDialog, setShowDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // ✅ Fetch stages from backend if project exists
    useEffect(() => {
        const fetchProjectStages = async () => {
            try {
                if (project._id) {
                    const data = await ProjectStageApi.getProjectStages({ project: project._id });
                    setStages(data);
                }
            } catch (err) {
                console.error("Failed to fetch project stages:", err);
            }
        };
        fetchProjectStages();
    }, [project?._id]);

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
        if (project._id) {
            const deleted = await ProjectStageApi.deleteProjectStage(saved);
            if (deleted) {
                setStages(stages.filter((s) => s._id !== saved._id));
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
        setStage(emptyProjectStage);
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
                    setStage(emptyProjectStage);
                    setShowDialog(true);
                }}
            />
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
                    setStage(rowData);
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
                    setStage(rowData);
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

    return (
        <div className="card">
            <Toolbar className="mb-4" start={startToolbarTemplate} />
            <DataTable
                value={stages}
                selection={saved}
                onSelectionChange={(e) => setStage(e.value as ProjectStage)}
                dataKey={stages.some((s) => s._id) ? "_id" : "stage"}
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 25]}
                className="datatable-responsive"
                emptyMessage="No project stages found."
                scrollable
                tableStyle={{ minWidth: "50rem" }}
                rowExpansionTemplate={(rowData: ProjectStage) => (
                    <ReviewerManager projectStage={rowData} />
                )}
            >
                <Column expander style={{ width: "3em" }} />
                <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: "50px" }} />
                <Column field="stage.name" header="Stage" sortable />
                <Column header="Document" body={documentBodyTemplate} />
                <Column field="status" header="Status" sortable />
                <Column body={actionBodyTemplate} headerStyle={{ minWidth: "10rem" }} />
            </DataTable>

            {saved && (
                <SaveProjectStageDialog
                    project={project}
                    projectStage={saved}
                    visible={showDialog}
                    //onSave={!project._id ? addProjectStage : undefined}
                    onComplete={onSaveComplete}
                    onHide={hideDialogs}
                />
            )}

            {saved && (
                <ConfirmDialog
                    showDialog={showDeleteDialog}
                    title={saved.stage ? saved.stage.toString() : "Project Stage"}
                    onConfirmAsync={project._id ? deleteProjectStage : undefined}
                    onConfirm={!project._id ? deleteProjectStage : undefined}
                    onHide={hideDialogs}
                />
            )}
        </div>
    );
}
