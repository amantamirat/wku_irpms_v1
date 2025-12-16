'use client';

import { CrudManager } from "@/components/CrudManager";
import { useAuth } from "@/contexts/auth-context";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useCrudList } from "@/hooks/useCrudList";
import { PERMISSIONS } from "@/types/permissions";
import { useEffect, useState } from "react";
import { Thematic, themeLevelIndex } from "../../models/thematic.model";
import { ThemeApi } from "../api/theme.api";
import { Theme } from "../models/theme.model";
import SaveDialog from "./SaveDialog";
import { FileUpload } from "primereact/fileupload";

interface ThemeManagerProps {
    thematicArea: Thematic;
    parent?: Theme;
    level?: number;
}

const ThemeManager = ({ thematicArea, parent, level = 0 }: ThemeManagerProps) => {

    const emptyTheme: Theme = {
        title: '',
        thematicArea: thematicArea,
        parent: parent
    };

    const { hasPermission } = useAuth();
    const confirm = useConfirmDialog();

    const canCreate = hasPermission([PERMISSIONS.THEME.CREATE]);
    const canImport = level === 0 && hasPermission([PERMISSIONS.THEME.IMPORT]);
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

    const themeLevel = themeLevelIndex[thematicArea.level];

    /** Fetch themes */
    const fetchThemes = async () => {
        try {
            setLoading(true);
            const data = await ThemeApi.getThemes({ thematicArea, parent, level });
            setAll(data);
        } catch (err: any) {
            setError("Failed to fetch themes. " + (err?.message ?? ""));
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
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

    const endToolbarTemplate = () => {
        if (!canImport) {
            return undefined;
        }
        const handleImport = async (event: any) => {
            try {
                const file = event.files[0];
                if (!file) return;

                const text = await file.text();
                const json = JSON.parse(text);

                // Expecting either array or { themesData: [...] }
                let themesData;
                if (Array.isArray(json)) {
                    themesData = json;
                } else {
                    themesData = json.themesData;
                }

                if (!Array.isArray(themesData)) {
                    /*
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Import Error',
                        detail: 'Invalid import data',
                        life: 3000
                    });
                    */
                    return;
                }
                // Call API
                if (thematicArea?._id) {
                    const result = await ThemeApi.importThemes(thematicArea._id, themesData);
                    /*
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Import Successful',
                        detail: `Imported ${result.length} themes`,
                        life: 3000
                    });
                    */
                }
                // Reload themes
                await fetchThemes();
            } catch (err) {
                /*
                toast.current?.show({
                    severity: 'error',
                    summary: 'Import Failed',
                    detail: '' + err,
                    life: 3000
                });
                */
            }
        }
        return (
            <div className="my-2">
                <FileUpload
                    mode="basic"
                    accept="application/json"
                    maxFileSize={100000}
                    chooseLabel="Import"
                    className="mr-2 inline-block"
                    customUpload
                    uploadHandler={handleImport}
                />
            </div>
        );
    };

    /** Columns shown in CRUD table */
    const columns = [
        { field: "title", header: "Title", sortable: true },
        { field: "priority", header: "Priority", sortable: true },
    ];

    const rowExpansionTemplate =
        themeLevel > level
            ? (row: any) => (
                <ThemeManager
                    thematicArea={thematicArea}
                    parent={row}
                    level={row.level + 1}
                />
            )
            : undefined;

    return (
        <>
            <CrudManager
                headerTitle="Manage Themes"
                //itemName={`Theme ${level}`}
                items={themes}
                dataKey="_id"
                columns={columns}
                loading={loading}
                error={error}

                toolbarEnd={endToolbarTemplate()}

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
                        item: row.title,
                        onConfirmAsync: () => deleteTheme(row)
                    })
                }

                rowExpansionTemplate={rowExpansionTemplate}

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
