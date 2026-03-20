import { useAuth } from "@/contexts/auth-context";
import { TabPanel, TabView } from "primereact/tabview";
import { useMemo } from "react";
import { Evaluation } from "../models/evaluation.model";
import CriterionManager from "./CriterionManager";
import StageManager from "../../grants/stages/components/StageManager";

interface EvaluationDetailProps {
    evaluation: Evaluation;
}

const EvaluationDetail = ({ evaluation }: EvaluationDetailProps) => {

    const { hasPermission } = useAuth();

    /**
     * Define tabs in a scalable configuration array
     */
    const tabs = useMemo(() => [
        {
            header: "Critera",
            permission: "criterion:read",
            content: <CriterionManager evaluation={evaluation} />
        },
        {
            header: "Grant Stage",
            permission: "grant.stage:read",
            content: <StageManager evaluation={evaluation} />
        }
    ], [evaluation]);

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

export default EvaluationDetail;

