import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Toolbar } from "primereact/toolbar";
import { useState } from "react";
import DeleteDialog from "@/components/DeleteDialog";
import { Project, PhaseType, Phase, Collaborator } from "../../models/project.model";

interface ProjectInfoStepProps {
    project: Project;
    setProject: (project: Project) => void;
    phaseType: PhaseType;
}

export default function PhasesManager({ project, setProject, phaseType }: ProjectInfoStepProps) {

    const emptyPhase: Phase = {
        type: phaseType,
        order: 0,
        duration: 0,
        budget: 0
    };

    const [phase, setPhase] = useState<Phase>(emptyPhase);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);


    const addPhase = () => {
        try {

        } catch (err) {
            console.log(err);
            alert(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            hideDialogs();
        }
    };


    const removePhase = () => {
        try {

        } catch (err) {
            console.log(err);
            alert(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            hideDialogs();
        }
    };


    const hideDialogs = () => {
        setPhase(emptyPhase);
        setShowAddDialog(false);
        setShowDeleteDialog(false);
    }

    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button icon="pi pi-plus" severity="success" className="mr-2" tooltip={`Add ${phaseType}`}
                onClick={() => {
                    //  setCollaborator(emptyCollaborator);
                    // setShowAddDialog(true);
                }}
            />
        </div>
    );


    const actionBodyTemplate = (rowData: Collaborator) => (
        <>
            <Button icon="pi pi-times" rounded severity="warning" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    // setCollaborator(rowData);
                    //  setShowDeleteDialog(true);
                }} />
        </>
    );


    return (
        <>
            <div className="card">
                <Toolbar className="mb-4" start={startToolbarTemplate} />
                <DataTable
                    value={project.phases}
                    selection={phase}
                    onSelectionChange={(e) => setPhase(e.value as Phase)}
                    dataKey="phase"
                    paginator
                    rows={10}
                    rowsPerPageOptions={[5, 10, 25]}
                    className="datatable-responsive"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    emptyMessage={'No phase found.'}
                    scrollable
                    tableStyle={{ minWidth: '50rem' }}
                >
                    <Column selectionMode="single" headerStyle={{ width: '3em' }}></Column>
                    <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                    <Column
                        field="phase"
                        header="Phase"
                        sortable
                        headerStyle={{ minWidth: '15rem' }}
                    />
                    <Column field="duration" header="Duration" sortable headerStyle={{ minWidth: '8rem' }} />
                    <Column field="budget" header="Budget" sortable headerStyle={{ minWidth: '15rem' }} />
                    <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }} />

                </DataTable>



            </div>
        </>
    );
}
