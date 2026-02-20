'use client';
import { CrudManager } from "@/components/CrudManager";
import { useAuth } from "@/contexts/auth-context";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useCrudList } from "@/hooks/useCrudList";
import { PERMISSIONS } from "@/types/permissions";
import { useEffect, useState } from "react";
import { Organization } from "../../organizations/models/organization.model";
import { GrantApi } from "../api/grant.api";
import { Grant } from "../models/grant.model";
import GrantDetail from "./GrantDetail";
import SaveDialog from "./SaveDialog";
import { Button } from "primereact/button";
import { useRouter } from "next/navigation";

interface GrantManagerProps {
    organization?: Organization;
}

const GrantManger = ({ organization }: GrantManagerProps) => {

    const { hasPermission } = useAuth();

    const confirm = useConfirmDialog();

    const emptyGrant: Grant = {
        //fundingSource: FundingSource.INTERNAL,
        //organization: organization ?? '',
        title: '',
        amount: 0
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
                const data = await GrantApi.getGrants({ organization });
                setAll(data);
            } catch (err: any) {
                setError("Failed to fetch grants. " + (err.message ?? ""));
            } finally {
                setLoading(false);
            }
        };
        fetchGrants();
    }, [organization]);

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

    const router = useRouter();

    const columns = [
        { field: "fundingSource", header: "Source", sortable: true },
        { field: "organization.name", header: "Organization", sortable: true },
        { field: "title", header: "Title", sortable: true },
        { field: "amount", header: "Amount", sortable: true, body: (rowData: any) => rowData.amount.toLocaleString() },
        { field: "description", header: "Description", sortable: true },
        /*
        {
            body: (row: Grant) => (
                <Button
                    icon="pi pi-arrow-right"
                    size="small"
                    onClick={() => router.push(`/grants/${row._id}`)}
                />
            )
        },
        */
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
                rowExpansionTemplate={(row) => <GrantDetail grant={row as Grant} />}
            />

            {(grant && showSaveDialog) && (
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
