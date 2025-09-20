import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Toolbar } from "primereact/toolbar";
import { useEffect, useState } from "react";
import DeleteDialog from "@/components/DeleteDialog";
import { Project } from "../../models/project.model";
import { Phase, PhaseType } from "../models/phase.model";
import { PhaseApi } from "../api/phase.api";
import SavePhaseDialog from "./SavePhaseDialog";




interface ProjectInfoStepProps {
    project: Project;
    phaseType: PhaseType;
}

export default function PhaseManager({ project, phaseType }: ProjectInfoStepProps) {

    const emptyPhase: Phase = {
        project:project,
        type: phaseType,
        activity: '',
        order: 0,
        duration: 0,
        budget: 0
    };

    const [phase, setPhase] = useState<Phase>(emptyPhase);
    const [phases, setPhases] = useState<Phase[]>([]);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);


    useEffect(() => {
        const fetchPhases = async () => {
            const data = await PhaseApi.getPhases({
                project: project._id
            });
            setPhases(data);
        };
        fetchPhases();
    }, [project?._id]);


    const addPhase = async () => {
        const exists = phases?.some(
            (p) => p.order === phase.order
        );
        if (exists) {
            throw new Error("The order is already added!");
        }
        let _phases = [...phases];

        if (phase._id) {
            const updated = await PhaseApi.updatePhase(phase);
            const index = _phases.findIndex((c) => c._id === updated._id);
            _phases[index] = { ...phase, updatedAt: updated.updatedAt };
        } else {
            const created = await PhaseApi.createPhase(phase);
            _phases.push({ ...phase, _id: created._id, updatedAt: created.updatedAt, createdAt: created.createdAt });
        }
        setPhases(_phases);
        hideDialogs();
    };


    const removePhase = async () => {
        const deleted = await PhaseApi.deletePhase(phase);
        if (deleted) {
            setPhases(phases.filter((c) => c._id !== phase._id));
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
                    setPhase(emptyPhase);
                    setShowAddDialog(true);
                }}
            />
        </div>
    );


    const actionBodyTemplate = (rowData: Phase) => (
        <>
            <Button icon="pi pi-times" rounded severity="warning" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setPhase(rowData);
                    setShowDeleteDialog(true);
                }} />
        </>
    );


    return (
        <>
            <div className="card">
                <Toolbar className="mb-4" start={startToolbarTemplate} />
                <DataTable
                    value={phases}
                    selection={phase}
                    onSelectionChange={(e) => setPhase(e.value as Phase)}
                    dataKey="_id"
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
                    <Column field="activity" header="Activity" sortable />
                    <Column field="order" header="Order" sortable />                    
                    <Column field="duration" header="Duration" sortable />
                    <Column field="budget" header="Budget" sortable />
                    <Column field="description" header="Description" sortable />
                    <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }} />

                </DataTable>

                {phase &&
                    <SavePhaseDialog
                        phase={phase}
                        setPhase={setPhase}
                        visible={showAddDialog}
                        onAdd={addPhase}
                        onHide={hideDialogs}
                    />}

                {phase && (
                    <DeleteDialog
                        showDeleteDialog={showDeleteDialog}
                        selectedDataInfo={`phase ${phase.order}`}
                        onDelete={removePhase}
                        onHide={hideDialogs}
                    />
                )}
            </div>
        </>
    );
}
