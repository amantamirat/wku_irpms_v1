import { useAuth } from "@/contexts/auth-context";
import { Thematic } from "../models/thematic.model";
import { useMemo } from "react";
import { PERMISSIONS } from "@/types/permissions";
import { TabPanel, TabView } from "primereact/tabview";
import ThemeManager from "../themes/components/ThemeManager";


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
            content: <ThemeManager thematicArea={thematic} />
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
                <TabPanel key={index} header={tab.header}>
                    {tab.content}
                </TabPanel>
            ))}
        </TabView>
    );
};

export default ThematicDetail;

