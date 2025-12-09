'use client';

import { CrudManager } from "@/components/CrudManager";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useCrudList } from "@/hooks/useCrudList";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { PERMISSIONS } from "@/types/permissions";
import { Thematic } from "../models/thematic.model";
import { ThematicApi } from "../api/thematic.api";
import MyBadge from "@/templates/MyBadge";
import { Organization } from "../../organizations/models/organization.model";
import SaveDialog from "./SaveDialog";

interface ThematicManagerProps {
    directorate?: Organization;
}


const ThematicManager = ({ directorate }: ThematicManagerProps) => {

    const emptyThematic: Thematic = {
        directorate: directorate ?? '',
        title: ''
    };

    const { hasPermission } = useAuth();
    const confirm = useConfirmDialog();

    const canCreate = hasPermission([PERMISSIONS.THEME.CREATE]);
    const canEdit = hasPermission([PERMISSIONS.THEME.UPDATE]);
    const canDelete = hasPermission([PERMISSIONS.THEME.DELETE]);

    // CRUD hook
    const {
        items: thematics,
        setAll,
        updateItem,
        removeItem,
        loading,
        setLoading,
        error,
        setError
    } = useCrudList<Thematic>();

    const [thematic, setThematic] = useState<Thematic>(emptyThematic);
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    /** Fetch thematics */
    useEffect(() => {
        const fetchThematics = async () => {
            try {
                setLoading(true);
                const data = await ThematicApi.getThematics({});
                setAll(data);
            } catch (err: any) {
                setError("Failed to fetch thematics. " + (err?.message ?? ""));
            } finally {
                setLoading(false);
            }
        };
        fetchThematics();
    }, []);

    /** Save callback */
    const onSaveComplete = (saved: Thematic) => {
        updateItem(saved);
        hideDialogs();
    };

    /** Delete */
    const deleteThematic = async (row: Thematic) => {
        const ok = await ThematicApi.deleteThematic(row);
        if (ok) removeItem(row);
    };

    /** Hide dialogs */
    const hideDialogs = () => {
        setShowSaveDialog(false);
    };

    /** Columns shown in CRUD table */
    const columns = [
        { field: "directorate.name", header: "Directorate", sortable: true },
        { field: "title", header: "Title", sortable: true },
        { field: "description", header: "Description", sortable: true },
        {
            header: "Level",
            field: "level",
            sortable: true,
            body: (r: Thematic) => (
                <span className={`theme-level-badge theme-${r.level?.toLowerCase()}`}>
                    {r.level}
                </span>
            )
        }
    ];

    return (
        <>
            <CrudManager
                headerTitle="Manage Thematics"
                itemName="Thematic"
                items={thematics}
                dataKey="_id"
                columns={columns}
                loading={loading}
                error={error}

                canCreate={canCreate}
                canEdit={canEdit}
                canDelete={canDelete}

                onCreate={() => {
                    setThematic({ ...emptyThematic });
                    setShowSaveDialog(true);
                }}

                onEdit={(row) => {
                    setThematic({ ...row });
                    setShowSaveDialog(true);
                }}

                onDelete={(row) =>
                    confirm.ask({
                        item: String(row.title),
                        onConfirmAsync: () => deleteThematic(row)
                    })
                }

                enableSearch
            />

            {/* Save Dialog */}
            {thematic && (
                <SaveDialog
                    visible={showSaveDialog}
                    thematic={thematic}
                    onComplete={onSaveComplete}
                    onHide={hideDialogs}
                />
            )}
        </>
    );
};

export default ThematicManager;
