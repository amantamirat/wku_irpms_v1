import ReviewerManager from "@/app/(main)/calls/reviewers/components/ReviewerManager";
import { useAuth } from "@/contexts/auth-context";
import { PERMISSIONS } from "@/types/permissions";
import { TabPanel, TabView } from "primereact/tabview";
import { useMemo } from "react";
import { ProjectDoc } from "../models/document.model";


interface DocDetailProps {
    doc: ProjectDoc;
    updateProjectDoc?: (projectDoc: ProjectDoc) => void;
}

const DocDetail = ({ doc, updateProjectDoc }: DocDetailProps) => {

    const { hasPermission } = useAuth();
    /**
     * Define tabs in a scalable configuration array
     */
    const tabs = useMemo(() => [
        {
            header: "Reveiwers",
            permission: PERMISSIONS.REVIEWER.READ,
            content: <ReviewerManager projectDoc={doc} updateProjectDoc={updateProjectDoc} />
        }
    ], [doc]);

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

export default DocDetail;

