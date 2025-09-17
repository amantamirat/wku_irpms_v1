import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Toolbar } from "primereact/toolbar";
import { useCallback, useEffect, useState } from "react";
import DeleteDialog from "@/components/DeleteDialog";
import { Project } from "../../models/project.model";
import { CollaboratorApi } from "../api/collaborator.api";
import CollaboratorDialog from "./CollaboratorDialog";
import { Collaborator, CollaboratorStatus } from "../models/collaborator.model";

interface CollaboratorProps {
    project: Project;
}

export default function CollaboratorManager({ project }: CollaboratorProps) {

    const emptyCollaborator: Collaborator = {
        project: project,
        applicant: "",
        status: CollaboratorStatus.pending
    };

    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [collaborator, setCollaborator] = useState<Collaborator>(emptyCollaborator);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    

    useEffect(() => {
        const fetchCollaborators = async () => {
            try {
                const data = await CollaboratorApi.getCollaborators({ project: project._id });
                setCollaborators(data);
            } catch (err) {
                console.error("Failed to fetch collaborators:", err);
            }
        };

        if (project?._id) {
            fetchCollaborators();
        }
    }, [project?._id]);


    const addCollaborator = async () => {
        let _collaborators = [...collaborators];
        if (collaborator._id) {
            const updated = await CollaboratorApi.updateCollaborator(collaborator);
            const index = _collaborators.findIndex((c) => c._id === updated._id);
            _collaborators[index] = { ...collaborator, updatedAt: updated.updatedAt };
        } else {
            const created = await CollaboratorApi.createCollaborator(collaborator);
            _collaborators.push({ ...collaborator, _id: created._id, updatedAt: created.updatedAt, createdAt: created.createdAt });
        }
        setCollaborators(_collaborators);
        hideDialogs();
    };

    const deleteCollaborator = async () => {
        const deleted = await CollaboratorApi.deleteCollaborator(collaborator);
        if (deleted) {
            setCollaborators(collaborators.filter((c) => c._id !== collaborator._id));
            hideDialogs();
        }
    };

    const hideDialogs = () => {
        setCollaborator(emptyCollaborator);
        setShowSaveDialog(false);
        setShowDeleteDialog(false);
    }

    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button icon="pi pi-plus" severity="success" className="mr-2" tooltip="Add Collaborator"
                onClick={() => {
                    setCollaborator(emptyCollaborator);
                    setShowSaveDialog(true);
                }}
            />
        </div>
    );


    const statusBodyTemplate = (rowData: Project) => {
        return (
            <span className={`collaborator-badge status-${rowData.status}`}>{rowData.status}</span>
        );
    };

    const actionBodyTemplate = (rowData: Collaborator) => (
        <>
            <Button icon="pi pi-pencil" rounded severity="success" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setCollaborator(rowData);
                    setShowSaveDialog(true);
                }} />
            <Button icon="pi pi-times" rounded severity="warning" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setCollaborator(rowData);
                    setShowDeleteDialog(true);
                }} />
        </>
    );

    return (
        <>
            <div className="card">
                <Toolbar className="mb-4" start={startToolbarTemplate} />
                <DataTable
                    value={collaborators}
                    selection={collaborator}
                    onSelectionChange={(e) => setCollaborator(e.value as Collaborator)}
                    dataKey="applicant._id"
                    paginator
                    rows={10}
                    rowsPerPageOptions={[5, 10, 25]}
                    className="datatable-responsive"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    emptyMessage={'No collaborators found.'}
                    scrollable
                    tableStyle={{ minWidth: '50rem' }}
                >
                    <Column selectionMode="single" headerStyle={{ width: '3em' }}></Column>
                    <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                    <Column
                        field="applicant.first_name"
                        header="Collaborator"
                        body={(rowData) => `${rowData.applicant.first_name} ${rowData.applicant.last_name}`}
                        sortable
                        headerStyle={{ minWidth: '15rem' }}
                    />
                    <Column field="applicant.gender" header="Gender" sortable headerStyle={{ minWidth: '8rem' }} />
                    <Column header="Status" body={statusBodyTemplate} sortable />
                    <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }} />

                </DataTable>

                {collaborator &&
                    <CollaboratorDialog
                        collaborator={collaborator}
                        setCollaborator={setCollaborator}
                        visible={showSaveDialog}
                        onAdd={addCollaborator}
                        onHide={hideDialogs}
                    />}

                {collaborator && collaborator.applicant && (
                    <DeleteDialog
                        showDeleteDialog={showDeleteDialog}
                        selectedDataInfo={String((collaborator.applicant as any).first_name)}
                        onDelete={deleteCollaborator}
                        onHide={hideDialogs}
                    />
                )}

            </div>
        </>
    );
}
