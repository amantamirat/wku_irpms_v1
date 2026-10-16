import type { User } from "@/app/(main)/users/models/user.model";
import type { PhaseActivity } from "../activities/models/phase-activity.model";

export type ProjectComponentStatus = "planned" | "approved" | "active" | "completed";

export type ProjectComponent = {
    _id?: string;
    project?: string;
    title: string;
    description?: string;
    contributors: Array<string | User>;
    activities?: PhaseActivity[];
    status?: ProjectComponentStatus;
};

export interface FilterProjectComponents {
    project?: string;
    phase?: string;
}
