'use client';
import { CrudManager } from "@/components/CrudManager";
import { useAuth } from "@/contexts/auth-context";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useCrudList } from "@/hooks/useCrudList";
import { PERMISSIONS } from "@/types/permissions";
import { useEffect, useState } from "react";
import { Organization } from "../../organizations/models/organization.model";
import { GrantApi } from "../api/grant.api";
import ConstraintContainer from "../constraints/components/ConstraintContainer";
import { Grant } from "../models/grant.model";
import SaveDialog from "./SaveDialog";

interface GrantManagerProps {
    directorate?: Organization;
}

const GrantManger = ({ directorate }: GrantManagerProps) => {

    const { hasPermission } = useAuth();

    const confirm = useConfirmDialog();

    const emptyGrant: Grant = {
        directorate: directorate ?? '',
        title: ''
    };

    // ✅ Permissions    
    const canCreate = hasPermission([PERMISSIONS.GRANT.CREATE]);
    const canEdit = hasPermission([PERMISSIONS.GRANT.UPDATE]);
    const canDelete = hasPermission([PERMISSIONS.GRANT.DELETE]);

    // ✅ State + CRUD Hook
    const {
        items: grants,
        updateItem,
        removeItem,
        setAll,
        loading,
        setLoading,
        error,
        setError
    } = useCrudList<Grant>();

    const [grant, setGrant] = useState<Grant>(emptyGrant);
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    // ✅ Fetch grants
    useEffect(() => {
        if (!directorate) {
            return
        }
        const fetchGrants = async () => {
            try {
                setLoading(true);
                const data = await GrantApi.getGrants({ directorate });
                setAll(data);
            } catch (err: any) {
                setError("Failed to fetch grants. " + (err.message ?? ""));
            } finally {
                setLoading(false);
            }
        };
        fetchGrants();
    }, [directorate]);

    // ✅ Save / update
    const onSaveComplete = (savedGrant: Grant) => {
        updateItem(savedGrant);
        hideSaveDialog();
    };

    const deleteGrant = async (row: Grant) => {
        const deleted = await GrantApi.deleteGrant(row);
        if (deleted) removeItem(row);
    };

    const hideSaveDialog = () => {
        setGrant(emptyGrant);
        setShowSaveDialog(false);
    };


    const columns = [
        //{ field: "directorate.name", header: "Directorate", sortable: true },
        { field: "title", header: "Title", sortable: true },
        { field: "description", header: "Description", sortable: true },
    ];

   
    return (
        <>
            <CrudManager
                headerTitle="Grant"
                items={grants}
                dataKey="_id"
                columns={columns}
                canCreate={canCreate}
                canEdit={canEdit}
                canDelete={canDelete}
                onCreate={() => { setGrant(emptyGrant); setShowSaveDialog(true); }}
                onEdit={(row) => { setGrant(row); setShowSaveDialog(true); }}
                onDelete={(row) => confirm.ask({ item: row.title, onConfirmAsync: () => deleteGrant(row) })}

                rowExpansionTemplate={(row) => <ConstraintContainer grant={row as Grant} />}
            />

            {grant && (
                <SaveDialog
                    visible={showSaveDialog}
                    grant={grant}
                    directorateProvided={!!directorate}
                    onComplete={onSaveComplete}
                    onHide={() => setShowSaveDialog(false)}
                />
            )}

        </>
    );
};

export default GrantManger;
