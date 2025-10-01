import { BASE_URL } from "@/api/ApiClient";
import ConfirmDialog from "@/components/ConfirmationDialog";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Toolbar } from "primereact/toolbar";
import { useEffect, useState } from "react";
import { Project } from "../../models/project.model";
import { ProjectStageApi } from "../api/stage.api";
import { ProjectStage, StageStatus } from "../models/stage.model";
import SaveProjectStageDialog from "./SaveProjectStageDialog";


interface ProjectInfoStepProps {
    project: Project;
}

export default function ProjectStageManager({ project }: ProjectInfoStepProps) {

    const emptyProjectStage: ProjectStage = {
        project: project,
        stage: '',
        status: StageStatus.pending
    };


    const [projectStage, setProjectStage] = useState<ProjectStage>(emptyProjectStage);
    const [projectStages, setProjectStages] = useState<ProjectStage[]>([]);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showConfirmationDialog, setShowshowConfirmationDialog] = useState(false);


    useEffect(() => {
        const fetchProjectStages = async () => {
            const data = await ProjectStageApi.getProjectStages({
                project: project._id
            });
            setProjectStages(data);
        };
        fetchProjectStages();
    }, [project?._id]);




    const saveProjectStage = async () => {

        let _projectStages = [...projectStages];

        if (projectStage._id) {
            const updated = await ProjectStageApi.updateProjectStage(projectStage);
            const index = _projectStages.findIndex((c) => c._id === updated._id);
            _projectStages[index] = { ...projectStage, updatedAt: updated.updatedAt };
        } else {
            const created = await ProjectStageApi.createProjectStage(projectStage);
            _projectStages.push({ ...projectStage, _id: created._id, documentPath: created.documentPath, updatedAt: created.updatedAt, createdAt: created.createdAt });
        }
        setProjectStages(_projectStages);
        hideDialogs();
    };


    const removeProjectStage = async () => {
        const deleted = await ProjectStageApi.deleteProjectStage(projectStage);
        if (deleted) {
            setProjectStages(projectStages.filter((c) => c._id !== projectStage._id));
            hideDialogs();
        }
    };


    const hideDialogs = () => {
        setProjectStage(emptyProjectStage);
        setShowAddDialog(false);
        setShowDeleteDialog(false);
    }

    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button icon="pi pi-plus" severity="success" className="mr-2"
                onClick={() => {
                    setProjectStage(emptyProjectStage);
                    setShowAddDialog(true);
                }}
            />
        </div>
    );

    const actionBodyTemplate2 = (rowData: ProjectStage) => {
        let label = "";
        let severity: "success" | "danger" = "success";

        if (rowData.status === StageStatus.pending) {
            label = "Submit";
            severity = "success";

        } else if (rowData.status === StageStatus.submitted) {
            label = "Withdraw";
            severity = "danger";
        }

        return (
            <>
                <Button
                    label={label}
                    severity={severity}
                    className="p-button-text"
                    onClick={() => {
                        setProjectStage(rowData);
                        setShowDeleteDialog(true);
                    }}
                />
            </>
        );
    };


    const actionBodyTemplate = (rowData: ProjectStage) => (
        <>
            <Button icon="pi pi-pencil" rounded severity="success" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setProjectStage(rowData);
                    setShowAddDialog(true);
                }} />

            <Button icon="pi pi-times" rounded severity="warning" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setProjectStage(rowData);
                    setShowDeleteDialog(true);
                }} />
        </>
    );


    return (
        <>
            <div className="card">
                <Toolbar className="mb-4" start={startToolbarTemplate} />
                <DataTable
                    value={projectStages}
                    selection={projectStage}
                    onSelectionChange={(e) => setProjectStage(e.value as ProjectStage)}
                    dataKey="_id"
                    paginator
                    rows={10}
                    rowsPerPageOptions={[5, 10, 25]}
                    className="datatable-responsive"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    emptyMessage={'No projectStage found.'}
                    scrollable
                    tableStyle={{ minWidth: '50rem' }}
                >
                    <Column selectionMode="single" headerStyle={{ width: '3em' }}></Column>
                    <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                    <Column field="stage.title" header="Stage" sortable />
                    <Column header="Document"
                        body={(rowData: ProjectStage) => {
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
                        }}
                    />
                    <Column field="status" header="Status" sortable />
                    <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }} />

                </DataTable>

                {projectStage &&
                    <SaveProjectStageDialog
                        project={project}
                        projectStage={projectStage}
                        setProjectStage={setProjectStage}
                        visible={showAddDialog}
                        onAdd={saveProjectStage}
                        onHide={hideDialogs}
                    />}

                {projectStage && (
                    <ConfirmDialog
                        showDialog={showDeleteDialog}
                        selectedDataInfo={`projectStage ${projectStage._id}`}
                        onConfirmAsync={removeProjectStage}
                        onHide={hideDialogs}
                    />
                )}

                
            </div>
        </>
    );
}
