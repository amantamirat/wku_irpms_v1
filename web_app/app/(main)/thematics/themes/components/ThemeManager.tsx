'use client';

import { createEntityManager } from "@/components/createEntityManager";
import { Theme, GetThemesOptions } from "../models/theme.model";
import { ThemeApi } from "../api/theme.api";
import SaveTheme from "./SaveTheme";
import { Thematic } from "../../models/thematic.model";


interface ThemeManagerProps {
    thematic?: Thematic;
    level?: number;
    parent?: Theme;
}

const ThemeManager = ({ thematic, level, parent }: ThemeManagerProps) => {

    const Manager = createEntityManager<Theme, GetThemesOptions | undefined>({
        title: "Manage Themes",
        itemName: "Theme",
        api: ThemeApi,

        columns: [
            { header: "Title", field: "title", sortable: true },
            {
                header: "Priority",
                field: "priority",
                sortable: true,
                style: { width: '120px' }
            },
            {
                header: "Level",
                field: "level",
                sortable: true,
                style: { width: '120px' }
            }
        ],
        query: () => ({
            thematicArea: thematic?._id ?? undefined,
            level,
            parent
        }),
        createNew: () => ({
            thematicArea: thematic ?? "",
            title: "",
            parent
        }),
        SaveDialog: SaveTheme,
        importConfig: {
            enable: !!thematic,
            importId: thematic?._id ?? undefined
        },
        permissionPrefix: "theme",
        expandable: {
            template: (row) => {
                const level = row.level ?? 0;
                // Stop expanding at level 3
                if (level >= 3) return undefined;
                return (
                    <ThemeManager parent={row} level={level + 1} />
                );
            }
        }
    });

    return <Manager />;
};

export default ThemeManager;