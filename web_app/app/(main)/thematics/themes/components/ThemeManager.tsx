'use client';

import { createEntityManager } from "@/components/createEntityManager";
import { Theme, GetThemesOptions } from "../models/theme.model"; // Ensure ThemeLevel is imported
import { ThemeApi } from "../api/theme.api";
import SaveTheme from "./SaveTheme";
import { Thematic, ThemeLevel } from "../../models/thematic.model";

interface ThemeManagerProps {
    thematic?: Thematic;
    level?: number;
    parent?: Theme;
}

const ThemeManager = ({ thematic, level = 0, parent }: ThemeManagerProps) => {

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
                const currentLevel = row.level ?? 0;
                const thematicLevel = thematic?.level;

                // 1. If it's Broad, never allow expansion
                if (thematicLevel === ThemeLevel.broad) {
                    return undefined;
                }

                // 2. If it's Division, maximum depth is level 1
                if (thematicLevel === ThemeLevel.divison && currentLevel >= 1) {
                    return undefined;
                }

                // 3. If it's Narrow, maximum depth is level 2
                if (thematicLevel === ThemeLevel.narrow && currentLevel >= 2) {
                    return undefined;
                }

                // 4. If it's Deep, maximum depth is level 3
                if (thematicLevel === ThemeLevel.deep && currentLevel >= 3) {
                    return undefined;
                }

                // Render the next nested tier and pass the thematic context along
                return (
                    <ThemeManager 
                        thematic={thematic} 
                        parent={row} 
                        level={currentLevel + 1} 
                    />
                );
            }
        }
    });

    return <Manager />;
};

export default ThemeManager;