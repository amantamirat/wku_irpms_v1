import { useAuth } from "@/contexts/auth-context";
import { Grant } from "../models/grant.model";
import { useMemo } from "react";
import { PERMISSIONS } from "@/types/permissions";
import ConstraintManager from "../constraints/components/ConstraintManager";
import CompositionManager from "../compositions/components/CompositionManager";
import { TabPanel, TabView } from "primereact/tabview";
import CallManager from "../../calls/components/CallManager";
import { StageApi } from "../stages/api/stage.api";
import { createEmptyStage, GetStagesDTO, Stage } from "../stages/models/stage.model";
import { createEntityManager } from "@/components/createEntityManager";
import SaveStage from "../stages/components/SaveStage";


interface GrantDetailProps {
    grant: Grant;
}

const GrantDetail = ({ grant }: GrantDetailProps) => {

    const { hasPermission } = useAuth();

    const StageManager = useMemo(() =>
        createEntityManager<Stage, GetStagesDTO>({
            title: "Stages",
            itemName: "Stage",
            api: StageApi,
            columns: [
                { header: "Name", field: "name" },
                { header: "Order", field: "order" },
                {
                    header: "Evaluation",
                    body: (s: Stage) =>
                        typeof s.evaluation === "object"
                            ? s.evaluation?.title
                            : s.evaluation
                }
            ],
            createNew: () => createEmptyStage({ grant }),
            SaveDialog: SaveStage,
            permissionPrefix: "grant_stage",
            query: () => ({
                grant: grant
            })
        })
        , [grant._id]);



    /**
     * Define tabs in a scalable configuration array
     */
    const tabs = useMemo(() => [
        {
            header: "Constraints",
            permission: PERMISSIONS.CONSTRAINT.READ,
            content: <ConstraintManager grant={grant} />
        },
        {
            header: "Compositions",
            permission: PERMISSIONS.CONSTRAINT.READ,
            content: <CompositionManager grant={grant} />
        },
        {
            header: "Stages",
            permission: "grant_stage:read",
            content: <StageManager />
        },
        {
            header: "Calls",
            permission: PERMISSIONS.CALL.READ,
            content: <CallManager grant={grant} />
        }
    ], [grant]);

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

export default GrantDetail;

