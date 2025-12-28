'use client';

import { CrudManager } from "@/components/CrudManager";
import { useAuth } from "@/contexts/auth-context";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useCrudList } from "@/hooks/useCrudList";
import { PERMISSIONS } from "@/types/permissions";
import { useEffect, useState } from "react";
import { Organization } from "../../organizations/models/organization.model";
import { ThematicApi } from "../api/thematic.api";
import { Thematic, ThemeLevel } from "../models/thematic.model";
import ThemeManager from "../themes/components/ThemeManager";
import SaveDialog from "./SaveDialog";
import { DirectorateSelector } from "@/components/DirectorateSelector";
import { useDirectorate } from "@/contexts/DirectorateContext";

interface ThematicManagerProps {
    directorate?: Organization;
}


const ThematicManager = () => {

    const { hasPermission } = useAuth();
    const confirm = useConfirmDialog();

    const canCreate = hasPermission([PERMISSIONS.THEME.CREATE]);
    const canEdit = hasPermission([PERMISSIONS.THEME.UPDATE]);
    const canDelete = hasPermission([PERMISSIONS.THEME.DELETE]);

    const { directorate, directorates } = useDirectorate();
    const emptyThematic: Thematic = {
        directorate: directorate ?? '',
        title: '',
        level: ThemeLevel.broad
    };

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
        if(!directorate){
            return
        }
        const fetchThematics = async () => {
            try {
                setLoading(true);
                const data = await ThematicApi.getThematics({directorate});
                setAll(data);
            } catch (err: any) {
                setError("Failed to fetch thematics. " + (err?.message ?? ""));
            } finally {
                setLoading(false);
            }
        };
        fetchThematics();
    }, [directorate]);

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
        {
            field: "type", header: "Type", sortable: true,
            body: (r: Thematic) => (
                <span className={`my-badge ${r.type?.toLowerCase()}`}>
                    {r.type}
                </span>
            )
        },
        {
            header: "Level",
            field: "level",
            sortable: true,
            body: (r: Thematic) => (
                <span className={`theme-level-badge theme-${r.level?.toLowerCase()}`}>
                    {r.level}
                </span>
            )
        },
        { field: "description", header: "Description" },
    ];

    const topTemplate = () => {
        return (<DirectorateSelector />)
    };

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

                topTemplate={topTemplate()}
                rowExpansionTemplate={(row) => <ThemeManager thematicArea={row as Thematic} />}
                enableSearch
            />

            {/* Save Dialog */}
            {thematic && (
                <SaveDialog
                    visible={showSaveDialog}
                    thematic={thematic}
                    directorates={directorates}
                    onComplete={onSaveComplete}
                    onHide={hideDialogs}
                />
            )}
        </>
    );
};

export default ThematicManager;
