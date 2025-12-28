"use client";
import { CrudManager } from "@/components/CrudManager";
import { useCrudList } from "@/hooks/useCrudList";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react";
import { ApplicantApi } from "../api/applicant.api";
import { Applicant, Gender } from "../models/applicant.model";
import SaveDialog from "./dialogs/SaveDialog";
import ApplicantDetail from "./ApplicantDetail";
import { PERMISSIONS } from "@/types/permissions";
import { Button } from "primereact/button";
import { Organization, OrgnUnit } from "../../organizations/models/organization.model";
import RoleDialog from "./dialogs/RoleDialog";
import OwnershipDialog from "./dialogs/OwnershipDialog";
import { Dropdown } from "primereact/dropdown";
import { OrganizationApi } from "../../organizations/api/organization.api";

interface ApplicantManagerProps {
    workspace?: Organization;
}

const ApplicantManager = ({ workspace }: ApplicantManagerProps) => {

    const confirm = useConfirmDialog();
    const { getScopesByUnit, hasPermission } = useAuth();

    const canCreate = hasPermission([PERMISSIONS.APPLICANT.CREATE]);
    const canEdit = hasPermission([PERMISSIONS.APPLICANT.UPDATE]);
    const canUpdateRoles = hasPermission([PERMISSIONS.APPLICANT.ROLE_UPDATE]);
    const canUpdateOwnerships = hasPermission([PERMISSIONS.APPLICANT.OWNERSHIP_UPDATE]);
    const canDelete = hasPermission([PERMISSIONS.APPLICANT.DELETE]);

    /** CRUD HOOK */
    const {
        items: applicants,
        setAll,
        updateItem,
        removeItem,
        loading,
        setLoading,
        error,
        setError
    } = useCrudList<Applicant>();

    const [localWorkspace, setLocalWorkspace] = useState<Organization | undefined>(
        workspace ? { ...workspace } : undefined
    );
    const [workspaces, setWorkspaces] = useState<Organization[]>([]);
    const emptyApplicant: Applicant = {
        workspace: localWorkspace ?? "",
        name: "",
        birthDate: new Date(),
        gender: Gender.Male,
        email: "",
    };
    const [selectedApplicant, setSelectedApplicant] = useState<Applicant>(emptyApplicant);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showRoleDialog, setShowRoleDialog] = useState(false);
    const [showOwnershipDialog, setShowOwnershipDialog] = useState(false);
    const hasWorkspace = !!localWorkspace;

    /** FETCH Workspace*/
    useEffect(() => {
        const fetchWorkspaces = async () => {
            try {
                setLoading(true);
                let departments = getScopesByUnit(OrgnUnit.Department);
                if (departments === "*") {
                    departments = await OrganizationApi.getOrganizations({ type: OrgnUnit.Department });
                }
                let externals = getScopesByUnit(OrgnUnit.External);
                if (externals === "*") {
                    externals = await OrganizationApi.getOrganizations({ type: OrgnUnit.External });
                }
                setWorkspaces([...departments, ...externals]);
            } catch (err: any) {
                setError("Failed to load workspaces: " + err?.message);
            } finally {
                setLoading(false);
            }
        };
        fetchWorkspaces();
    }, []);

    /** FETCH Applicants */
    useEffect(() => {
        const fetchApplicants = async () => {
            try {
                setLoading(true);
                if (!localWorkspace) {
                    return;
                }
                const data = await ApplicantApi.getApplicants({ workspace: localWorkspace });
                setAll(data);
            } catch (err: any) {
                setError("Failed to load applicants: " + err?.message);
            } finally {
                setLoading(false);
            }
        };
        fetchApplicants();
    }, [localWorkspace]);

    /** SAVE callback */
    const onSaveComplete = (saved: Applicant) => {
        updateItem(saved);
        hideDialogs();
    };

    /** DELETE */
    const deleteApplicant = async (row: Applicant) => {
        const ok = await ApplicantApi.deleteApplicant(row);
        if (ok) removeItem(row);
    };

    const hideDialogs = () => {
        setSelectedApplicant({ ...emptyApplicant });
        setShowSaveDialog(false);
        setShowRoleDialog(false);
        setShowOwnershipDialog(false);
    };

    /** TABLE COLUMNS */
    const columns = [
        ...(!hasWorkspace ? [
            { header: "Workspace", field: "workspace.name", sortable: true },
        ] : []),

        { header: "Name", field: "name", sortable: true },

        {
            header: "Gender",
            body: (row: Applicant) => (
                <span className={`gender-badge gender-${row.gender.toLowerCase()}`}>
                    {row.gender}
                </span>
            ),
            sortable: true
        },
        {
            header: "Birth Date",
            body: (row: Applicant) =>
                new Date(row.birthDate!).toLocaleDateString("en-CA")
        },
        {
            header: "FIN", field: "fin", sortable: true
        },
        {
            header: "ORCID", field: "orcid", sortable: true
        },
        { header: "Email", field: "email" }
    ];

    const topTemplate = () => {
        if (workspace) {
            return undefined;
        }
        return (
            <div className="card p-fluid">
                <div className="formgrid grid">
                    <div className="field col-12 md:col-6 lg:col-4">
                        <label htmlFor="workspace">Workspace</label>
                        <Dropdown
                            id="workspace"
                            value={localWorkspace}
                            options={workspaces}
                            onChange={(e) => setLocalWorkspace(e.value)}
                            optionLabel="name"
                            placeholder="Select Workspace"
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>

            <CrudManager
                headerTitle="Manage Applicants"
                //itemName="Applicant"
                items={applicants}
                dataKey="_id"
                columns={columns}
                loading={loading}
                error={error}
                canCreate={canCreate}
                canEdit={canEdit}
                canDelete={canDelete}
                /** CREATE */
                onCreate={() => {
                    setSelectedApplicant({ ...emptyApplicant });
                    setShowSaveDialog(true);
                }}
                /** EDIT */
                onEdit={(row) => {
                    setSelectedApplicant({ ...row });
                    setShowSaveDialog(true);
                }}
                /** DELETE */
                onDelete={(row) =>
                    confirm.ask({
                        item: `${row.name}`,
                        onConfirmAsync: () => deleteApplicant(row)
                    })
                }

                topTemplate={topTemplate()}

                /** EXPANSION ROW */
                rowExpansionTemplate={(row) => (
                    <ApplicantDetail applicant={row} />
                )}

                extraActions={
                    (row) =>
                        <>
                            {canUpdateRoles &&
                                <Button icon="pi pi-crown" rounded
                                    tooltip="Roles"
                                    severity="secondary"
                                    className="p-button-rounded p-button-text"
                                    style={{ fontSize: '2rem' }}
                                    onClick={() => {
                                        setSelectedApplicant({ ...row });
                                        setShowRoleDialog(true);
                                    }}
                                />}
                            {canUpdateOwnerships &&
                                <Button icon="pi pi-sparkles" rounded
                                    tooltip="Ownerships"
                                    severity="info"
                                    className="p-button-rounded p-button-text"
                                    style={{ fontSize: '2rem' }}
                                    onClick={() => {
                                        setSelectedApplicant({ ...row });
                                        setShowOwnershipDialog(true);
                                    }}
                                />}
                        </>
                }

                enableSearch
            />

            {/* SAVE DIALOG */}
            {(selectedApplicant && (
                <SaveDialog
                    visible={showSaveDialog}
                    applicant={selectedApplicant}
                    //hasWorkspace={hasWorkspace}
                    workspaces={workspaces}
                    onComplete={onSaveComplete}
                    onHide={hideDialogs}
                />
            ))}

            {/* ROLE DIALOG */}
            {((selectedApplicant && canUpdateRoles) && (
                <RoleDialog
                    visible={showRoleDialog}
                    applicant={selectedApplicant}
                    onComplete={onSaveComplete}
                    onHide={hideDialogs}
                />
            ))}

            {/* OWNERSHIP DIALOG */}
            {((selectedApplicant && canUpdateOwnerships) && (
                <OwnershipDialog
                    visible={showOwnershipDialog}
                    applicant={selectedApplicant}
                    onComplete={onSaveComplete}
                    onHide={hideDialogs}
                />
            ))}
        </>
    );
};

export default ApplicantManager;
