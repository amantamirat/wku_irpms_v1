'use client';

import { CrudManager } from "@/components/CrudManager";
import { useAuth } from "@/contexts/auth-context";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useCrudList } from "@/hooks/useCrudList";
import { PERMISSIONS } from "@/types/permissions";
import { useEffect, useState } from "react";
import { Thematic } from "../../models/thematic.model";
import { ThemeApi } from "../api/theme.api";
import { Theme } from "../models/theme.model";
import SaveDialog from "./SaveDialog";

interface ThemeManagerProps {
    thematicArea: Thematic;
    parent?: Theme;
}


const ThemeManager = ({ thematicArea, parent }: ThemeManagerProps) => {

    const emptyTheme: Theme = {
        title: '',
        thematicArea: thematicArea,
        parent: parent
    };

    const { hasPermission } = useAuth();
    const confirm = useConfirmDialog();

    const canCreate = hasPermission([PERMISSIONS.THEME.CREATE]);
    const canEdit = hasPermission([PERMISSIONS.THEME.UPDATE]);
    const canDelete = hasPermission([PERMISSIONS.THEME.DELETE]);

    // CRUD hook
    const {
        items: themes,
        setAll,
        updateItem,
        removeItem,
        loading,
        setLoading,
        error,
        setError
    } = useCrudList<Theme>();

    const [theme, setTheme] = useState<Theme>(emptyTheme);
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    /** Fetch themes */
    useEffect(() => {
        const fetchThemes = async () => {
            try {
                setLoading(true);
                const data = await ThemeApi.getThemes({ thematicArea, parent });
                setAll(data);
            } catch (err: any) {
                setError("Failed to fetch themes. " + (err?.message ?? ""));
            } finally {
                setLoading(false);
            }
        };
        fetchThemes();
    }, []);

    /** Save callback */
    const onSaveComplete = (saved: Theme) => {
        updateItem(saved);
        hideDialogs();
    };

    /** Delete */
    const deleteTheme = async (row: Theme) => {
        const ok = await ThemeApi.deleteTheme(row);
        if (ok) removeItem(row);
    };

    /** Hide dialogs */
    const hideDialogs = () => {
        setShowSaveDialog(false);
    };

    /** Columns shown in CRUD table */
    const columns = [
        { field: "title", header: "Title", sortable: true },
        { field: "priority", header: "Priority", sortable: true },
    ];

    return (
        <>
            <CrudManager
                headerTitle="Manage Themes"
                itemName="Theme"
                items={themes}
                dataKey="_id"
                columns={columns}
                loading={loading}
                error={error}

                canCreate={canCreate}
                canEdit={canEdit}
                canDelete={canDelete}

                onCreate={() => {
                    setTheme({ ...emptyTheme });
                    setShowSaveDialog(true);
                }}

                onEdit={(row) => {
                    setTheme({ ...row });
                    setShowSaveDialog(true);
                }}

                onDelete={(row) =>
                    confirm.ask({
                        item: String(row.title),
                        onConfirmAsync: () => deleteTheme(row)
                    })
                }

                enableSearch
            />

            {/* Save Dialog */}
            {theme && (
                <SaveDialog
                    visible={showSaveDialog}
                    theme={theme}
                    onComplete={onSaveComplete}
                    onHide={hideDialogs}
                />
            )}
        </>
    );
};

export default ThemeManager;
