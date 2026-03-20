import { useAuth } from "@/contexts/auth-context";
import { useMemo } from "react";
import { PERMISSIONS } from "@/types/permissions";
import { TabPanel, TabView } from "primereact/tabview";
import CallManager from "../../calls/components/CallManager";
import { Calendar } from "../models/calendar.model";


interface CalendarDetailProps {
    calendar: Calendar;
}

const CalendarDetail = ({ calendar }: CalendarDetailProps) => {

    const { hasPermission } = useAuth();
    /**
     * Define tabs in a scalable configuration array
     */
    const tabs = useMemo(() => [
        {
            header: "Calls",
            permission: "call:read",
            content: <CallManager calendar={calendar} />
        }
    ], [calendar]);

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

export default CalendarDetail;

