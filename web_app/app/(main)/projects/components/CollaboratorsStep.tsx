import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Collaborator, Project } from "../models/project.model";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Toolbar } from "primereact/toolbar";
import { useState } from "react";
import { Button } from "primereact/button";
import AddCollaboratorDialog from "./AddCollaboratorDialog";

interface ProjectInfoStepProps {
    project: Project;
    setProject: (project: Project) => void;
}

export default function CollaboratorsStep({ project, setProject }: ProjectInfoStepProps) {

    const emptyCollaborator: Collaborator = {
        applicant: ""
    };

    const [collaborator, setCollaborator] = useState<Collaborator>();
    const [showAddDialog, setShowAddDialog] = useState(false);

    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button icon="pi pi-plus" severity="success" className="mr-2" tooltip="Add Collaborator"
                onClick={() => {
                    setShowAddDialog(true);
                }}
            />
        </div>
    );
    return (
        <>
            <div className="card">
                <Toolbar className="mb-4" start={startToolbarTemplate} />
                <DataTable
                    value={project.collaborators}
                    selection={collaborator}
                    onSelectionChange={(e) => setCollaborator(e.value as Collaborator)}
                    dataKey="_id"
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
                    <Column field="first_name" header="First Name" sortable />
                    <Column field="last_name" header="Last Name" sortable />
                    <Column field="birth_date" header="Birth Date" body={(rowData) => new Date(rowData.birth_date!).toLocaleDateString('en-CA')} />
                </DataTable>


                <AddCollaboratorDialog
                    collaborator={emptyCollaborator}
                    setCollaborator={setCollaborator}
                    visible={showAddDialog}
                    onSave={() => setShowAddDialog(false)}
                    onHide={() => setShowAddDialog(false)}
                />

            </div>
        </>
    );
}
