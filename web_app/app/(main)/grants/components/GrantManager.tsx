'use client';
import { CrudManager } from "@/components/CrudManager";
import ErrorCard from "@/components/ErrorCard";
import ListSkeleton from "@/components/ListSkeleton";
import { useAuth } from "@/contexts/auth-context";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useCrudList } from "@/hooks/useCrudList";
import { PERMISSIONS } from "@/types/permissions";
import { useEffect, useState } from "react";
import { Organization } from "../../organizations/models/organization.model";
import { GrantApi } from "../api/grant.api";
import { GetGrantsOptions, Grant } from "../models/grant.model";
import SaveDialog from "./SaveDialog";
import ConstraintContainer from "../constraints/components/ConstraintContainer";

interface GrantManagerProps {
    directorate?: Organization;
}

const GrantManger = ({ directorate }: GrantManagerProps) => {

    const { getApplicant: getLinkedApplicant, hasPermission } = useAuth();
    const linkedApplicant = getLinkedApplicant();
    //const loggedApplicantId = linkedApplicant?._id ?? linkedApplicant;

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
        const fetchGrants = async () => {
            try {
                setLoading(true);
                const options: GetGrantsOptions = {
                    directorate: directorate,
                };
                const data = await GrantApi.getGrants(options);
                setAll(
                    data.map(g => ({
                        ...g,
                        directorate: directorate ?? g.directorate
                    }))
                );
            } catch (err: any) {
                setError("Failed to fetch grants. " + (err.message ?? ""));
            } finally {
                setLoading(false);
            }
        };
        fetchGrants();
    }, [directorate]);

    if (loading) return <ListSkeleton rows={10} />;
    if (error) return <ErrorCard errorMessage={error} />;

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
        { field: "directorate.name", header: "Directorate", sortable: true },
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
                    onComplete={onSaveComplete}
                    onHide={() => setShowSaveDialog(false)}
                />
            )}

        </>
    );
};

export default GrantManger;
