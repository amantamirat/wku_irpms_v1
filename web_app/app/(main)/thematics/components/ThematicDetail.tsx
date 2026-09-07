import { useAuth } from "@/contexts/auth-context";
import { PERMISSIONS } from "@/types/permissions";
import { TabPanel, TabView } from "primereact/tabview";
import { useMemo } from "react";
import { Thematic } from "../models/thematic.model";
import ThemeManager from "../themes/components/ThemeManager";
import ThemeHierarchyPreview from "./ThemeHierarchyPreview";


interface ThematicDetailProps {
    thematic: Thematic;
}

const ThematicDetail = ({ thematic }: ThematicDetailProps) => {

    const { hasPermission } = useAuth();

    /**
     * Define tabs in a scalable configuration array
     */
    const tabs = useMemo(() => [

        {
            header: "Themes",
            permission: PERMISSIONS.THEME.READ,
            content: <ThemeManager thematic={thematic} level={0} />
        },
        {
            header: "Hierarchy Preview", // New Preview Tab
            permission: "theme:lookup",
            content: <ThemeHierarchyPreview thematic={thematic} />
        }
    ], [thematic]);

    /**
     * Filter tabs based on permissions
     */
    const allowedTabs = tabs.filter(tab =>
        hasPermission([tab.permission])
    );

    return (
        <TabView>
            {allowedTabs.map((tab, index) => (
                <TabPanel key={index} header={tab.header}                >
                    {tab.content}
                </TabPanel>
            ))}
        </TabView>
    );
};

export default ThematicDetail;

