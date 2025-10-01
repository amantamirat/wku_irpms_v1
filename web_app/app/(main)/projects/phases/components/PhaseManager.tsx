import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Toolbar } from "primereact/toolbar";
import { useEffect, useState } from "react";
import ConfirmDialog from "@/components/ConfirmationDialog";
import { Project } from "../../models/project.model";
import { Phase, PhaseType } from "../models/phase.model";
import { PhaseApi } from "../api/phase.api";
import SavePhaseDialog from "./SavePhaseDialog";

interface ProjectInfoStepProps {
    phaseType: PhaseType;
    project: Project;
    setProject?: (project: Project) => void;
}

export default function PhaseManager({ phaseType, project, setProject }: ProjectInfoStepProps) {

    const emptyPhase: Phase = {
        type: phaseType,
        project: project,
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
        if (project._id) {
            fetchPhases();
        }
        else {
            setPhases(project.phases ?? []);
        }

    }, [project?._id]);


    const savePhase = async () => {
        const exists = phases?.some(
            (p) =>
                p.order === phase.order &&
                p._id?.toString() !== phase._id?.toString()
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
            _phases.push({ ...created, project: phase.project });
        }
        setPhases(_phases);
        hideDialogs();
    };


    const deletePhase = async () => {
        const deleted = await PhaseApi.deletePhase(phase);
        if (deleted) {
            setPhases(phases.filter((c) => c._id !== phase._id));
            hideDialogs();
        }
    };

    const addPhase = () => {
        const exists = project.phases?.some((p) => p.order === phase.order);
        if (exists) {
            throw new Error("The order is already added!");
        }
        const updatedPhases = [...(project.phases || []), phase];
        if (setProject) {
            setProject({ ...project, phases: updatedPhases });
        }
        setPhases(updatedPhases);
        hideDialogs();
    };

    const removePhase = () => {
        const updatedPhases = project.phases?.filter((p) => p.order !== phase.order) || [];
        if (setProject) {
            setProject({ ...project, phases: updatedPhases });
        }
        setPhases(updatedPhases);
        hideDialogs();
    }

    const hideDialogs = () => {
        setPhase(emptyPhase);
        setShowAddDialog(false);
        setShowDeleteDialog(false);
    }

    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button icon="pi pi-plus" severity="success" className="mr-2" tooltip={`Add ${phaseType}`}
                onClick={() => {
                    let newPhase = { ...emptyPhase };
                    const maxLevel = Math.max(0, ...phases.map(e => e.order ?? 0));
                    newPhase.order = maxLevel + 1;
                    setPhase(newPhase);
                    setShowAddDialog(true);
                }}
            />
        </div>
    );


    const actionBodyTemplate = (rowData: Phase) => (
        <>
            <Button icon="pi pi-pencil" rounded severity="success" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setPhase(rowData);
                    setShowAddDialog(true);
                }} />
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
                    dataKey="order"
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
                    {
                        //<Column field="description" header="Description" sortable />
                    }
                    <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }} />

                </DataTable>

                {phase &&
                    <SavePhaseDialog
                        phase={phase}
                        setPhase={setPhase}
                        visible={showAddDialog}
                        onSave={project._id ? savePhase : undefined}
                        onAdd={!project._id ? addPhase : undefined}
                        onHide={hideDialogs}
                    />}

                {phase && (
                    <ConfirmDialog
                        showDialog={showDeleteDialog}
                        selectedDataInfo={`phase ${phase.activity} (order ${phase.order})`}
                        onConfirmAsync={project._id ? deletePhase : undefined}
                        onConfirm={!project._id ? removePhase : undefined}
                        onHide={hideDialogs}
                    />
                )}
            </div>
        </>
    );
}
