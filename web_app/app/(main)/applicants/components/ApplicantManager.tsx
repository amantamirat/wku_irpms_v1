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
import { Organization } from "../../organizations/models/organization.model";

interface ApplicantManagerProps {
    workspace?: Organization;
}

const ApplicantManager = ({ workspace }: ApplicantManagerProps) => {

    const emptyApplicant: Applicant = {
        workspace: workspace ?? "",
        name: "",
        //lastName: "",
        birthDate: new Date(),
        gender: Gender.Male,
        email: "",
    };


    const confirm = useConfirmDialog();
    const { getOrganizationsByType, hasPermission } = useAuth();

    const canCreate = hasPermission([PERMISSIONS.APPLICANT.CREATE]);
    const canEdit = hasPermission([PERMISSIONS.APPLICANT.UPDATE]);
    const canUpdateRoles = hasPermission([PERMISSIONS.APPLICANT.UPDATE_ROLES]);
    const canDelete = hasPermission([PERMISSIONS.APPLICANT.DELETE]);

    const hasWorkspace = !!workspace;
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

    const [selectedApplicant, setSelectedApplicant] = useState<Applicant>(emptyApplicant);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showRolesDialog, setShowRolesDialog] = useState(false);

    /** FETCH Applicants */
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await ApplicantApi.getApplicants({ workspace });
                setAll(data);
            } catch (err: any) {
                setError("Failed to load applicants: " + err?.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [workspace]);

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

    /** LINK USER */
    /*
    const linkApplicant = async (row: Applicant) => {
        let linked = await ApplicantApi.linkApplicant(row);

        linked = {
            ...linked,
            organization: row.organization
        };

        updateItem(linked);
    };
    */

    const hideDialogs = () => {
        setSelectedApplicant({ ...emptyApplicant });
        setShowSaveDialog(false);
        setShowRolesDialog(false);
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

    return (
        <>
            <CrudManager
                headerTitle="Manage Applicants"
                itemName="Applicant"
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
                /** EXPANSION ROW */
                rowExpansionTemplate={(row) => (
                    <ApplicantDetail applicant={row} />
                )}

                /** 
                 * extraActions={
                    (row) =>
                        canUpdateRoles &&
                        <Button icon="pi pi-shield" rounded
                            severity="secondary"
                            className="p-button-rounded p-button-text"
                            style={{ fontSize: '2rem' }}
                            onClick={() => {
                                setSelectedApplicant({ ...row });
                                setShowRolesDialog(true);
                                setShowSaveDialog(true);
                            }}
                        />
                }
                 * 
                */
                enableSearch
            />

            {/* SAVE DIALOG */}
            {(selectedApplicant && (
                <SaveDialog
                    visible={showSaveDialog}
                    applicant={selectedApplicant}
                    hasWorkspace={hasWorkspace}
                    onComplete={onSaveComplete}
                    onHide={hideDialogs}
                />
            ))}
        </>
    );
};

export default ApplicantManager;
