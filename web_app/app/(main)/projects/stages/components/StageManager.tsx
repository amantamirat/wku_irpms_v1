import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Toolbar } from "primereact/toolbar";
import { useEffect, useState } from "react";
import DeleteDialog from "@/components/DeleteDialog";
import { Project } from "../../models/project.model";
import { ProjectStage } from "../models/stage.model";
import { ProjectStageApi } from "../api/stage.api";
import SaveProjectStageDialog from "./SaveProjectStageDialog";


interface ProjectInfoStepProps {
    project: Project;
}

export default function ProjectStageManager({ project }: ProjectInfoStepProps) {

    const emptyProjectStage: ProjectStage = {
        project: project,
        stage: ''
    };

    const [projectStage, setProjectStage] = useState<ProjectStage>(emptyProjectStage);
    const [projectStages, setProjectStages] = useState<ProjectStage[]>([]);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);


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
            _projectStages.push({ ...projectStage, _id: created._id, updatedAt: created.updatedAt, createdAt: created.createdAt });
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
                    
                    <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }} />

                </DataTable>

                {projectStage &&
                    <SaveProjectStageDialog
                        projectStage={projectStage}
                        setProjectStage={setProjectStage}
                        visible={showAddDialog}
                        onAdd={saveProjectStage}
                        onHide={hideDialogs}
                    />}

                {projectStage && (
                    <DeleteDialog
                        showDeleteDialog={showDeleteDialog}
                        selectedDataInfo={`projectStage ${projectStage._id}`}
                        onDelete={removeProjectStage}
                        onHide={hideDialogs}
                    />
                )}
            </div>
        </>
    );
}
