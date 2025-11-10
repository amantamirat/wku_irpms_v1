import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable, DataTableFilterMeta } from "primereact/datatable";
import { Toolbar } from "primereact/toolbar";
import { useEffect, useState } from "react";
import ConfirmDialog from "@/components/ConfirmationDialog";
import { Project } from "../../models/project.model";
import { CollaboratorApi } from "../api/collaborator.api";
import CollaboratorDialog from "./CollaboratorDialog";
import { Collaborator, CollaboratorStatus } from "../models/collaborator.model";
import { Applicant } from "@/app/(main)/applicants/models/applicant.model";
import { InputText } from "primereact/inputtext";
import { handleGlobalFilterChange, initFilters } from "@/utils/filterUtils";
import Badge from "@/templates/Badge";

interface CollaboratorProps {
    project?: Project;
    onSave?: (collaborator: Collaborator) => void;
    onRemove?: (collaborator: Collaborator) => void;
}

const CollaboratorManager = ({ project, onSave, onRemove }: CollaboratorProps) => {

    const emptyCollaborator: Collaborator = {
        project: project ?? "",
        applicant: "",
        status: CollaboratorStatus.pending
    };

    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [collaborator, setCollaborator] = useState<Collaborator>(emptyCollaborator);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };

    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
    }, []);

    useEffect(() => {
        const fetchCollaborators = async () => {
            try {
                const data = await CollaboratorApi.getCollaborators({ project: project?._id });
                console.log("Fetched collaborators:", data);
                setCollaborators(data);
            } catch (err) {
                console.error("Failed to fetch collaborators:", err);
            }
        };
        // if (project?._id) {
        fetchCollaborators();
        // }
        // else {
        //  setCollaborators(project.collaborators ?? []);
        // }
    }, [project?._id]);


    const onSaveComplete = (savedCollaborator: Collaborator) => {
        let _collaborators = [...collaborators]; // local copy of state
        const index = _collaborators.findIndex(
            (c) => (c.applicant as Applicant)._id === (savedCollaborator.applicant as Applicant)._id
        );
        if (index !== -1) {
            _collaborators[index] = { ...savedCollaborator };
        } else {
            _collaborators.push({ ...savedCollaborator });
        }
        setCollaborators(_collaborators); // update state
        hideDialogs(); // close dialog
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
                visible={!!project}
            />
        </div>
    );

    const statusBodyTemplate = (rowData: Collaborator) => {
        return (
            <Badge type="status" value={rowData.status ?? 'Unknown'} />
        );
    };


    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Collaborators</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" value={globalFilter} onChange={onGlobalFilterChange} placeholder="Search..." className="w-full md:w-1/3" />
            </span>
        </div>
    );

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
                {project &&
                    <Toolbar className="mb-4" start={startToolbarTemplate} />
                }
                <DataTable
                    value={collaborators}
                    selection={collaborator}
                    header={header}
                    onSelectionChange={(e) => setCollaborator(e.value as Collaborator)}
                    dataKey={project?._id ? "_id" : "applicant._id"}
                    paginator
                    rows={10}
                    rowsPerPageOptions={[5, 10, 25]}
                    className="datatable-responsive"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    emptyMessage={'No collaborators found.'}
                    scrollable
                    //tableStyle={{ minWidth: '50rem' }}
                    globalFilter={globalFilter}
                    filters={filters}
                >
                    <Column selectionMode="single" headerStyle={{ width: '3em' }}></Column>
                    <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                    <Column
                        field="applicant.first_name"
                        header="Collaborator"
                        body={(rowData) => `${rowData.applicant.first_name} ${rowData.applicant.last_name}`}
                        sortable
                    />
                    <Column field="applicant.gender" header="Gender" sortable headerStyle={{ minWidth: '8rem' }} />
                    {!project &&
                        <Column field="project.title" header="Project" sortable />
                    }
                    <Column header="Status" body={statusBodyTemplate} sortable />
                    {project &&
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }} />
                    }
                </DataTable>

                {project && collaborator &&
                    <CollaboratorDialog
                        collaborator={collaborator}
                        visible={showSaveDialog}
                        onSave={onSave}
                        onComplete={onSaveComplete}
                        onHide={hideDialogs}
                    />}

                {project && collaborator && collaborator.applicant && (
                    <ConfirmDialog
                        showDialog={showDeleteDialog}
                        title={String((collaborator.applicant as any).first_name)}
                        onConfirmAsync={project._id ? deleteCollaborator : undefined}
                        onHide={hideDialogs}
                    />
                )}

            </div>
        </>
    );
}
export default CollaboratorManager;