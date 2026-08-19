import { createEntityManager } from "@/components/createEntityManager";
import { VerificationConfigurationApi } from "../api/verification-conf.api";
import { createEmptyVerificationConfiguration, VerificationConfiguration } from "../models/verification-conf.model";
import { VERIFICATION_CONFIG_TRANSITIONS, VERIFICATION_CONFIG_STATUS_ORDER } from "../models/verification-conf.state-machine";
import SaveVerificationConfiguration from "./SaveVerificationConfiguration";
import { Grant } from "../../../grants/models/grant.model";
import MyBadge from "@/templates/MyBadge";

export default createEntityManager<VerificationConfiguration>({
    title: "Manage Verification Configurations",
    itemName: "Verification Configuration",
    api: VerificationConfigurationApi,
    columns: [
        {
            header: "Grant",
            body: (c: VerificationConfiguration) => {
                const grant = c.grant as Grant;
                if (typeof grant === "object") {
                    return grant.title;
                }
                return "-";
            }
        },
        {
            header: "Deadline",
            body: (v: VerificationConfiguration) =>
                v.deadline ? new Date(v.deadline).toLocaleDateString() : "-"
        },
        { header: "Min Reviewers", field: "minReviewers" },
        { header: "Max Reviewers", field: "maxReviewers" },
        { header: "Max Attempts", field: "maxAttempts" },
        /*
        {
            field: "status",
            header: "Status",
            sortable: true,
            body: (v: VerificationConfiguration) =>
                <MyBadge type="status" value={v.status ?? 'Unknown'} />
        },*/
    ],
    createNew: createEmptyVerificationConfiguration,
    SaveDialog: SaveVerificationConfiguration,
    permissionPrefix: "grant",
    /*
    workflow: {
        statusField: "status",
        transitions: VERIFICATION_CONFIG_TRANSITIONS,
        statusOrder: VERIFICATION_CONFIG_STATUS_ORDER
    }*/
});