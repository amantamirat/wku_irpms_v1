"use client";

import { CrudManager } from "@/components/CrudManager";
import { useCrudList } from "@/hooks/useCrudList";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useAuth } from "@/contexts/auth-context";

import { useEffect, useState } from "react";
import { ApplicantApi } from "../api/applicant.api";
import { Applicant, Gender, applicantUnits } from "../models/applicant.model";

import SaveDialog from "./dialogs/SaveDialog";
import ApplicantDetail from "./ApplicantDetail";
import ErrorCard from "@/components/ErrorCard";


const ApplicantManager = () => {

    const emptyApplicant: Applicant = {
        first_name: "",
        last_name: "",
        birth_date: new Date(),
        gender: Gender.Male,
        user: undefined,
        organization: "",
    };

    const confirm = useConfirmDialog();
    const { getOrganizationsByType, hasPermission } = useAuth();

    const canCreate = hasPermission(["applicant:create"]);
    const canEdit = hasPermission(["applicant:update"]);
    const canDelete = hasPermission(["applicant:delete"]);

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

    /** FETCH Applicants */
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                const orgs = getOrganizationsByType(applicantUnits).map((o) => o._id);

                const data = await ApplicantApi.getApplicants({
                    organization: orgs.length ? orgs : undefined
                });

                setAll(data);
            } catch (err: any) {
                setError("Failed to load applicants: " + err?.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

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
    const linkApplicant = async (row: Applicant) => {
        let linked = await ApplicantApi.linkApplicant(row);

        linked = {
            ...linked,
            organization: row.organization
        };

        updateItem(linked);
    };

    const hideDialogs = () => {
        setShowSaveDialog(false);
        setSelectedApplicant(emptyApplicant);
    };

    /** TABLE COLUMNS */
    const columns = [
        { header: "First Name", field: "first_name" },
        { header: "Last Name", field: "last_name" },
        {
            header: "Gender",
            body: (row: Applicant) => (
                <span className={`gender-badge gender-${row.gender.toLowerCase()}`}>
                    {row.gender}
                </span>
            )
        },
        {
            header: "Birth Date",
            body: (row: Applicant) =>
                new Date(row.birth_date!).toLocaleDateString("en-CA")
        },
        { header: "Organization", field: "organization.name" },
        //{ header: "Email", field: "email" }
    ];

    return (
        <>
            {/* ERROR MESSAGE */}
            {error && <ErrorCard errorMessage={error} />}

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
                        item: `${row.first_name} ${row.last_name}`,
                        onConfirmAsync: () => deleteApplicant(row)
                    })
                }               
                /** EXPANSION ROW */
                rowExpansionTemplate={(row) => (
                    <ApplicantDetail applicant={row} />
                )}

                enableSearch
            />

            {/* SAVE DIALOG */}
            {(selectedApplicant && (
                <SaveDialog
                    visible={showSaveDialog}
                    applicant={selectedApplicant}
                    onComplete={onSaveComplete}
                    onHide={hideDialogs}
                />
            ))}
        </>
    );
};

export default ApplicantManager;
