'use client';

import { CrudManager } from "@/components/CrudManager";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useCrudList } from "@/hooks/useCrudList";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { PERMISSIONS } from "@/types/permissions";
import { SpecializationApi } from "../api/specialization.api";
import { Specialization } from "../models/specialization.model";
import SaveSpecialization from "./SaveSpecialization";
import { Applicant } from "../../applicants/models/applicant.model";

interface SpecManagerProps {
    applicant?: Applicant;
}

const SpecializationManager = ({ applicant }: SpecManagerProps) => {

    const emptySpecialization: Specialization = {
        name: "",
    };

    const { hasPermission } = useAuth();
    const confirm = useConfirmDialog();

    const canCreate = !applicant && hasPermission([PERMISSIONS.CALENDAR.CREATE]);
    const canEdit = !applicant && hasPermission([PERMISSIONS.CALENDAR.UPDATE]);
    const canDelete = !applicant && hasPermission([PERMISSIONS.CALENDAR.DELETE]);

    // CRUD hook
    const {
        items: specializations,
        setAll,
        updateItem,
        removeItem,
        loading,
        setLoading,
        error,
        setError
    } = useCrudList<Specialization>();

    const [specialization, setSpecialization] = useState<Specialization>(emptySpecialization);
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    /** Fetch specializations */
    useEffect(() => {
        if (applicant) {
            setAll(applicant.specializations as Specialization[]);
            return
        }
        const fetchSpecializations = async () => {
            try {
                setLoading(true);
                const data = await SpecializationApi.getAll();
                setAll(data);
            } catch (err: any) {
                setError("Failed to fetch specializations. " + (err?.message ?? ""));
            } finally {
                setLoading(false);
            }
        };
        fetchSpecializations();
    }, [applicant]);

    /** Save callback */
    const onSaveComplete = (saved: Specialization) => {
        updateItem(saved);
        hideDialogs();
    };

    /** Delete */
    const deleteSpecialization = async (row: Specialization) => {
        const ok = await SpecializationApi.delete(row);
        if (ok) removeItem(row);
    };

    /** Hide dialogs */
    const hideDialogs = () => {
        setShowSaveDialog(false);
    };

    /** Columns shown in CRUD table */
    const columns = [
        { header: "Name", field: "name" },
        {
            header: "Ac. Level",
            field: "academicLevel",
            sortable: true,
            body: (r: Specialization) => (
                <span className={`academic-badge level-${r.academicLevel?.toLowerCase()}`}>
                    {r.academicLevel}
                </span>
            )
        }
    ];

    return (
        <>
            <CrudManager
                headerTitle="Manage Specializations"
                itemName="Specialization"
                items={specializations}
                dataKey="_id"
                columns={columns}
                loading={loading}
                error={error}

                canCreate={canCreate}
                canEdit={canEdit}
                canDelete={canDelete}

                onCreate={() => {
                    setSpecialization({ ...emptySpecialization });
                    setShowSaveDialog(true);
                }}

                onEdit={(row) => {
                    setSpecialization({ ...row });
                    setShowSaveDialog(true);
                }}

                onDelete={(row) =>
                    confirm.ask({
                        item: String(row.name),
                        onConfirmAsync: () => deleteSpecialization(row)
                    })
                }

                enableSearch={!applicant}
            />

            {/* Save Dialog */}
            {(specialization && (canCreate || canEdit)) && (
                <SaveSpecialization
                    visible={showSaveDialog}
                    specialization={specialization}
                    onComplete={onSaveComplete}
                    onHide={hideDialogs}
                />
            )}
        </>
    );
};

export default SpecializationManager;
