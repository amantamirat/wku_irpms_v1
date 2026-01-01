'use client';

import { CrudManager } from "@/components/CrudManager";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react";

import { Project, ProjectStatus } from "../../models/project.model";
import { Theme } from "@/app/(main)/thematics/themes/models/theme.model";

import { ProjectThemeApi } from "../api/project.theme.api";
import { ProjectTheme } from "../models/project.theme.model";
import SaveThemeDialog from "./SaveThemeDialog";

import { useCrudList } from "@/hooks/useCrudList";
import { PERMISSIONS } from "@/types/permissions";
import { Call } from "@/app/(main)/calls/models/call.model";

interface ProjectThemeManagerProps {
    project: Project;
    flyMode?: boolean;
    onSave?: (pt: ProjectTheme) => void;
    onRemove?: (pt: ProjectTheme) => void;
}

export default function ProjectThemeManager({
    project,
    flyMode = false,
    onSave,
    onRemove
}: ProjectThemeManagerProps) {

    const confirm = useConfirmDialog();
    const { hasPermission } = useAuth();

    // -------------------------------
    // Empty ProjectTheme
    // -------------------------------
    const emptyProjectTheme: ProjectTheme = {
        project: !flyMode ? project : "-",
        theme: ""
    };

    // -------------------------------
    // Permissions
    // -------------------------------
    const isValidStatus = project.status === ProjectStatus.pending ||
        project.status === ProjectStatus.negotiation;
    const canCreate = isValidStatus && hasPermission([PERMISSIONS.PROJECT_THEME.CREATE]);
    const canEdit = isValidStatus && hasPermission([PERMISSIONS.PROJECT_THEME.UPDATE]);
    const canDelete = isValidStatus && hasPermission([PERMISSIONS.PROJECT_THEME.DELETE]);

    // -------------------------------
    // CRUD Hook
    // -------------------------------
    const {
        items: projectThemes,
        setAll,
        updateItem,
        removeItem,
        loading,
        setLoading,
        error,
        setError
    } = useCrudList<ProjectTheme>();

    const [projectTheme, setProjectTheme] = useState<ProjectTheme>(emptyProjectTheme);
    const [showDialog, setShowDialog] = useState(false);

    // -------------------------------
    // Fetch project themes
    // -------------------------------
    useEffect(() => {
        const fetchProjectThemes = async () => {
            try {
                setLoading(true);
                const data = await ProjectThemeApi.getProjectThemes({ project });
                setAll(data);
            } catch (err: any) {
                setError("Failed to fetch project themes. " + (err?.message ?? ""));
            } finally {
                setLoading(false);
            }
        };

        if (flyMode && project) {
            setAll(project.themes ?? []);
            return;
        }

        fetchProjectThemes();

    }, [project]);

    // -------------------------------
    // Save / Create
    // -------------------------------
    const onSaveComplete = (saved: ProjectTheme) => {
        updateItem(saved);
        hideDialog();
    };

    // -------------------------------
    // Delete
    // -------------------------------
    const deleteProjectTheme = async (row: ProjectTheme) => {
        const deleted = await ProjectThemeApi.delete(row);
        if (deleted) removeItem(row);
    };

    // -------------------------------
    // Helpers
    // -------------------------------
    const hideDialog = () => {
        setProjectTheme(emptyProjectTheme);
        setShowDialog(false);
    };

    const handleCreate = () => {
        setProjectTheme(emptyProjectTheme);
        setShowDialog(true);
    };

    const handleEdit = (row: ProjectTheme) => {
        setProjectTheme(row);
        setShowDialog(true);
    };

    // -------------------------------
    // Table Columns
    // -------------------------------
    const columns = [
        {
            field: "theme.title",
            header: "Theme",
            sortable: true
        }
    ];

    return (
        <>
            <CrudManager
                headerTitle="Project Themes"
                items={projectThemes}
                dataKey={flyMode ? "theme._id" : "_id"}
                //dataKey={projectThemes.some(pt => pt._id) ? "_id" : "theme._id"}
                columns={columns}
                loading={loading}
                error={error}
                canCreate={canCreate}
                //canEdit={canEdit}
                canDelete={canDelete}
                onCreate={handleCreate}
                //onEdit={handleEdit}
                onDelete={(row) =>
                    confirm.ask({
                        item: String((row.theme as Theme)?.title ?? "Theme"),
                        onConfirm: flyMode && onRemove ? () => onRemove(row) : undefined,
                        onConfirmAsync: !flyMode ? () => deleteProjectTheme(row) : undefined
                    })
                }
            />
            {
                (isValidStatus && showDialog) && <SaveThemeDialog
                    //project={project}
                    projectTheme={projectTheme}
                    visible={showDialog}
                    onSave={flyMode && onSave ? onSave : undefined}
                    thematic={(project.call as Call).thematic}
                    onComplete={onSaveComplete}
                    onHide={hideDialog}
                />
            }

        </>
    );
}
