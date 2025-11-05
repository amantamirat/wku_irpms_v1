'use client';

import { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Toolbar } from "primereact/toolbar";
import ConfirmDialog from "@/components/ConfirmationDialog";
import SavePhaseDialog from "./SavePhaseDialog";
import { Project } from "../../models/project.model";
import { Phase, PhaseType } from "../models/phase.model";
import { PhaseApi } from "../api/phase.api";

interface PhaseManagerProps {
    project: Project;
    phaseType: PhaseType;
    setProject?: (project: Project) => void;
}

export default function PhaseManager({ project, phaseType, setProject }: PhaseManagerProps) {
    const emptyPhase: Phase = {
        project: project,
        type: phaseType,
        activity: "",
        duration: 0,
        budget: 0,
        description: "",
    };

    const [phases, setPhases] = useState<Phase[]>([]);
    const [phase, setPhase] = useState<Phase>(emptyPhase);
    const [showDialog, setShowDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    useEffect(() => {
        const fetchPhases = async () => {
            try {
                if (project._id) {
                    const data = await PhaseApi.getPhases({ project: project._id });
                    setPhases(data);
                } else {
                    setPhases(project.phases ?? []);
                }
            } catch (err) {
                console.error("Failed to fetch phases:", err);
            }
        };
        fetchPhases();
    }, [project?._id]);

    const onSaveComplete = (saved: Phase) => {
        const existingIndex = phases.findIndex((p) => p._id === saved._id);
        const updated = existingIndex !== -1
            ? phases.map((p, i) => (i === existingIndex ? saved : p))
            : [...phases, saved];
        setPhases(updated);
        hideDialogs();
    };

    const addPhase = (saved: Phase) => {
        const updatedPhases = [...(project.phases || []), saved];
        if (setProject) setProject({ ...project, phases: updatedPhases });
        hideDialogs();
    };

    const deletePhase = async () => {
        if (project._id) {
            const deleted = await PhaseApi.deletePhase(phase);
            if (deleted) {
                setPhases(phases.filter((p) => p._id !== phase._id));
            }
        } else {
            const updated = project.phases?.filter((p) => p.activity !== phase.activity) || [];
            if (setProject) setProject({ ...project, phases: updated });
        }
        hideDialogs();
    };

    const hideDialogs = () => {
        setPhase(emptyPhase);
        setShowDialog(false);
        setShowDeleteDialog(false);
    };

    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button
                icon="pi pi-plus"
                severity="success"
                className="mr-2"
                tooltip={`Add ${phaseType}`}
                onClick={() => {
                    setPhase(emptyPhase);
                    setShowDialog(true);
                }}
            />
        </div>
    );

    const actionBodyTemplate = (rowData: Phase) => (
        <>
            <Button icon="pi pi-pencil" rounded severity="success" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }}
                onClick={() => {
                    setPhase(rowData);
                    setShowDialog(true);
                }} />
            <Button icon="pi pi-times" rounded severity="warning" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }}
                onClick={() => {
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
                    dataKey={phases.some(p => p._id) ? "_id" : "order"}
                    paginator
                    rows={10}
                    rowsPerPageOptions={[5, 10, 25]}
                    className="datatable-responsive"
                    emptyMessage="No phases found."
                    scrollable
                    tableStyle={{ minWidth: '50rem' }}
                >
                    <Column selectionMode="single" headerStyle={{ width: '3em' }} />
                    <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                    <Column field="activity" header="Activity" sortable />
                    <Column field="duration" header="Duration (days)" sortable />
                    <Column field="budget" header="Budget (ETB)" sortable />
                    <Column field="description" header="Description" sortable />
                    <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }} />
                </DataTable>

                {phase && (
                    <SavePhaseDialog
                        phase={phase}
                        visible={showDialog}
                        onSave={!project._id ? addPhase : undefined}
                        onComplete={onSaveComplete}
                        onHide={hideDialogs}
                    />
                )}

                {phase && (
                    <ConfirmDialog
                        showDialog={showDeleteDialog}
                        selectedDataInfo={phase.activity}
                        onConfirmAsync={project._id ? deletePhase : undefined}
                        onConfirm={!project._id ? deletePhase : undefined}
                        onHide={hideDialogs}
                    />
                )}
            </div>
        </>
    );
}
