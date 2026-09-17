
import { createEntityManager } from "@/components/data-table/createEntityManager";
import { Grant } from "../../../grants/models/grant.model";
import { VerificationConfigurationApi } from "../api/verification-conf.api";
import { createEmptyVerificationConfiguration, VerificationConfiguration } from "../models/verification-conf.model";
import SaveVerificationConfiguration from "./SaveVerificationConfiguration";
import { VERIFICATION_CONFIGURATION_TRANSITIONS } from "../models/verification-conf.state-machine";
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
        {
            field: "status",
            header: "Status",
            sortable: true,
            //style: { width: '150px' },
            body: (c: VerificationConfiguration) =>
                <MyBadge type="status" value={c.status ?? "Unknown"} />
        }

    ],
    createNew: createEmptyVerificationConfiguration,
    SaveDialog: SaveVerificationConfiguration,
    workflow: {
        statusField: "status",
        transitions: VERIFICATION_CONFIGURATION_TRANSITIONS,
    },
    permissionPrefix: "verification-conf",
});