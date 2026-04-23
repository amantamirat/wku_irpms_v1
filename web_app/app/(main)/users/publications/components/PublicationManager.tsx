'use client';

import { CrudManager } from "@/components/CrudManager";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useCrudList } from "@/hooks/useCrudList";
import { useEffect, useState } from "react";
import { PublicationApi } from "../api/publication.api";
import { Publication } from "../models/publication.model";
import { useAuth } from "@/contexts/auth-context";
import { PERMISSIONS } from "@/types/permissions";
import SavePublicationDialog from "./SavePublicationDialog";
import { User } from "../../models/user.model";

interface PublicationManagerProps {
    applicant?: User;
}

const PublicationManager = ({ applicant }: PublicationManagerProps) => {

    const { hasPermission } = useAuth();
    const confirm = useConfirmDialog();

    const canCreate = hasPermission([PERMISSIONS.PUBLICATION.CREATE]);
    const canEdit = hasPermission([PERMISSIONS.PUBLICATION.UPDATE]);
    const canDelete = hasPermission([PERMISSIONS.PUBLICATION.DELETE]);

    // CRUD hook
    const {
        items: publications,
        setAll,
        updateItem,
        removeItem,
        loading,
        setLoading,
        error,
        setError
    } = useCrudList<Publication>();

    const emptyPublication: Publication = {
        applicant: applicant,
    };
    const [publication, setPublication] = useState<Publication>({});
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    /** Fetch publications */
    useEffect(() => {
        const fetchPublications = async () => {
            try {
                setLoading(true);
                const data = await PublicationApi.getPublications({ applicant });
                setAll(data);
            } catch (err: any) {
                setError("Failed to fetch publications. " + (err?.message ?? ""));
            } finally {
                setLoading(false);
            }
        };
        fetchPublications();
    }, [applicant]);

    /** Save callback */
    const onSaveComplete = (saved: Publication) => {
        updateItem(saved);
        hideDialogs();
    };

    /** Delete function */
    const deletePublication = async (row: Publication) => {
        const ok = await PublicationApi.delete(row);
        if (ok) removeItem(row);
    };

    /** Hide dialogs */
    const hideDialogs = () => {
        setShowSaveDialog(false);
    };

    /** Columns */
    const columns = [
        { header: "Title", field: "title" },
        { header: "Type", field: "type" },
        { header: "Published Date", field: "publishedDate" },
        !applicant && { header: "Applicant", field: "applicant.name" },
    ].filter(Boolean);

    return (
        <>
            <CrudManager
                headerTitle="Manage Publications"
                items={publications}
                dataKey="_id"
                columns={columns}
                loading={loading}
                error={error}
                canCreate={canCreate}
                canEdit={canEdit}
                canDelete={canDelete}
                onCreate={() => {
                    setPublication(emptyPublication);
                    setShowSaveDialog(true);
                }}

                onEdit={(row) => {
                    setPublication({ ...row });
                    setShowSaveDialog(true);
                }}

                onDelete={(row) =>
                    confirm.ask({
                        item: row._id,
                        onConfirmAsync: () => deletePublication(row)
                    })
                }

                enableSearch
            />

            {(publication && showSaveDialog) && (
                <SavePublicationDialog
                    visible={showSaveDialog}
                    publication={publication}
                    applicantProvided={!!applicant}
                    onComplete={onSaveComplete}
                    onHide={hideDialogs}
                />
            )}
        </>
    );
};

export default PublicationManager;
