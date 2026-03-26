'use client';

import { createEntityManager } from "@/components/createEntityManager";
import { Theme, GetThemesOptions } from "../models/theme.model";
import { ThemeApi } from "../api/theme.api";
import SaveTheme from "./SaveTheme";
import { Thematic } from "../../models/thematic.model";


interface ThemeManagerProps {
    thematic?: Thematic;
    level?: number;
}

const ThemeManager = ({ thematic, level }: ThemeManagerProps) => {

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
            level
        }),
        createNew: () => ({
            thematicArea: thematic ?? "",
            title: ""
        }),
        SaveDialog: SaveTheme,
        importConfig: {
            enable: true,
            importId: thematic?._id ?? undefined
        },
        permissionPrefix: "theme",
    });

    return <Manager />;
};

export default ThemeManager;