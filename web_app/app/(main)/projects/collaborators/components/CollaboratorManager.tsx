import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Toolbar } from "primereact/toolbar";
import { useCallback, useEffect, useState } from "react";
import DeleteDialog from "@/components/DeleteDialog";
import { Collaborator, Project } from "../../models/project.model";
import { Applicant } from "@/app/(main)/applicants/models/applicant.model";
import { CollaboratorApi } from "../api/collaborator.api";

interface CollaboratorProps {
    project: Project;
}

export default function CollaboratorManager({ project }: CollaboratorProps) {

    const emptyCollaborator: Collaborator = {
        project: project,
        applicant: ""
    };

    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [collaborator, setCollaborator] = useState<Collaborator>(emptyCollaborator);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const loadCollaborators = useCallback(async () => {
        try {
            const data = await CollaboratorApi.getCollaborators({ project: project._id });
            setCollaborators(data);
        } catch (err) {
            console.log(err);
        } finally {

        }
    }, [project]);

    useEffect(() => {
        loadCollaborators();
    }, [loadCollaborators]);

    const addCollaborator = () => {
        try {
            const applicant = collaborator.applicant as Applicant;
            if (!applicant || !applicant._id) {
                throw new Error("Please select a valid collaborator.");
            }

        } catch (err) {
            console.log(err);
            alert(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            hideDialogs();
        }
    };

    const removeCollaborator = () => {
        try {
            const applicant = collaborator.applicant as Applicant;

            if (!applicant || !applicant._id) {
                throw new Error("Invalid collaborator.");
            }

        } catch (err) {
            console.log(err);
            alert(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            hideDialogs();
        }
    };

    const hideDialogs = () => {
        setCollaborator(emptyCollaborator);
        setShowAddDialog(false);
        setShowDeleteDialog(false);
    }

    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button icon="pi pi-plus" severity="success" className="mr-2" tooltip="Add Collaborator"
                onClick={() => {
                    setCollaborator(emptyCollaborator);
                    setShowAddDialog(true);
                }}
            />
        </div>
    );

    const actionBodyTemplate = (rowData: Collaborator) => (
        <>
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
                    
                    <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }} />

                </DataTable>



                {collaborator && collaborator.applicant && (
                    <DeleteDialog
                        showDeleteDialog={showDeleteDialog}
                        selectedDataInfo={String((collaborator.applicant as any).full_name)}
                        onDelete={removeCollaborator}
                        onHide={hideDialogs}
                    />
                )}

            </div>
        </>
    );
}
