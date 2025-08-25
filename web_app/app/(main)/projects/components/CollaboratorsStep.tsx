import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Toolbar } from "primereact/toolbar";
import { useState } from "react";
import { Collaborator, Project } from "../models/project.model";
import AddCollaboratorDialog from "./AddCollaboratorDialog";
import { Applicant } from "../../applicants/models/applicant.model";
import DeleteDialog from "@/components/DeleteDialog";

interface ProjectInfoStepProps {
    project: Project;
    setProject: (project: Project) => void;
}

export default function CollaboratorsStep({ project, setProject }: ProjectInfoStepProps) {

    const emptyCollaborator: Collaborator = {
        applicant: ""
    };

    const [collaborator, setCollaborator] = useState<Collaborator>(emptyCollaborator);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);


    const addCollaborator = () => {
        try {
            const applicant = collaborator.applicant as Applicant;
            if (!applicant || !applicant._id) {
                throw new Error("Please select a valid collaborator.");
            }
            const exists = project.collaborators?.some(
                (c) => (c.applicant as Applicant)._id === applicant._id
            );
            if (exists) {
                throw new Error("This collaborator is already added!");
            }
            const updatedCollaborators = [...(project.collaborators || []), collaborator];
            setProject({ ...project, collaborators: updatedCollaborators });
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
            const updatedCollaborators = project.collaborators?.filter(
                (c) => (c.applicant as Applicant)._id !== applicant._id
            ) || [];

            setProject({ ...project, collaborators: updatedCollaborators });
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
                    value={project.collaborators}
                    selection={collaborator}
                    onSelectionChange={(e) => setCollaborator(e.value as Collaborator)}
                    dataKey="applicant._id"
                    paginator
                    rows={10}
                    rowsPerPageOptions={[5, 10, 25]}
                    className="datatable-responsive"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    emptyMessage={'No collaborator found.'}
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
                    <Column
                        field="applicant.organization.name"
                        header="Workspace"
                        sortable
                        headerStyle={{ minWidth: '15rem' }} // use minWidth instead of width
                        body={(rowData) => rowData.applicant.organization?.name || '-'} // safe access
                    />
                    <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }} />

                </DataTable>

                {collaborator &&
                    <AddCollaboratorDialog
                        collaborator={collaborator}
                        setCollaborator={setCollaborator}
                        visible={showAddDialog}
                        onAdd={addCollaborator}
                        onHide={hideDialogs}
                    />}

                {collaborator && collaborator.applicant && (
                    <DeleteDialog
                        showDeleteDialog={showDeleteDialog}
                        selectedDataInfo={String((collaborator.applicant as Applicant).first_name)}
                        onDelete={removeCollaborator}
                        onHide={hideDialogs}
                    />
                )}

            </div>
        </>
    );
}
