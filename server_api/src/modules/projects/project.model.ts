import mongoose, {
    Document,
    model,
    Schema
} from "mongoose";

import { COLLECTIONS } from "../../common/constants/collections.enum";
import { IStatusHistory } from "../../common/types/status-history";
import { createStatusHistorySchema } from "../../common/schemas/status-history.schema";


export enum ProjectStatus {
    draft = "draft",
    approved = "approved",
    refused = "refused",
    granted = "granted",
    completed = "completed"
}


export interface IProject extends Document {

    _id: mongoose.Types.ObjectId;

    /**
     * Grant under which the project is funded.
     */
    grant: mongoose.Types.ObjectId;

    /**
     * Organization responsible for the grant.
     * Usually a directorate or external organization.
     *
     * Used as an organizational access boundary.
     */
    organization: mongoose.Types.ObjectId;

    /**
     * Workspace/organization of the lead PI.
     * Usually a department or other academic unit.
     *
     * Used as an organizational access boundary.
     */
    workspace: mongoose.Types.ObjectId;

    calendar?: mongoose.Types.ObjectId | null;

    call?: mongoose.Types.ObjectId | null;

    title: string;

    summary?: string;

    totalBudget?: number;

    totalDuration?: number;

    totalCollabs?: number;

    leadPI: mongoose.Types.ObjectId;

    themes: mongoose.Types.ObjectId[];

    currentApplication?: mongoose.Types.ObjectId | null;

    currentPhase?: mongoose.Types.ObjectId | null;

    currentVerification?: mongoose.Types.ObjectId | null;

    status: ProjectStatus;

    statusHistory: IStatusHistory<ProjectStatus>[];

    createdBy?: mongoose.Types.ObjectId;

    updatedBy?: mongoose.Types.ObjectId;

    createdAt?: Date;

    updatedAt?: Date;
}


const ProjectStatusHistorySchema =
    createStatusHistorySchema(
        Object.values(ProjectStatus)
    );


const ProjectSchema = new Schema<IProject>(
    {

        grant: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.GRANT,
            required: true,
            immutable: true
        },

        /**
         * Organization responsible for the grant.
         */
        organization: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.ORGANIZATION,
            required: true
        },

        /**
         * Workspace of the lead PI.
         */
        workspace: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.ORGANIZATION,
            required: true
        },

        calendar: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.CALENDAR,
            required: true
        },

        call: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.CALL,
            immutable: true
        },

        title: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },

        summary: {
            type: String,
            trim: true
        },

        totalBudget: {
            type: Number,
            min: 0
        },

        totalDuration: {
            type: Number,
            min: 0
        },

        totalCollabs: {
            type: Number,
            min: 0
        },

        leadPI: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.USER,
            required: true
        },

        themes: {
            type: [{
                type: Schema.Types.ObjectId,
                ref: COLLECTIONS.THEME
            }],
            default: []
        },

        currentApplication: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.APPLICATION
        },

        currentPhase: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.PHASE
        },

        currentVerification: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.VERIFICATION
        },

        status: {
            type: String,
            enum: Object.values(ProjectStatus),
            default: ProjectStatus.draft,
            required: true
        },

        statusHistory: {
            type: [ProjectStatusHistorySchema],
            default: []
        },

        createdBy: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.USER
        },

        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.USER
        }

    },
    {
        timestamps: true
    }
);


/*
 * Current application must belong to only one project.
 */
ProjectSchema.index(
    { currentApplication: 1 },
    {
        unique: true,
        partialFilterExpression: {
            currentApplication: {
                $type: "objectId"
            }
        }
    }
);


/*
 * Current phase must belong to only one project.
 */
ProjectSchema.index(
    { currentPhase: 1 },
    {
        unique: true,
        partialFilterExpression: {
            currentPhase: {
                $type: "objectId"
            }
        }
    }
);


/*
 * Current verification must belong to only one project.
 */
ProjectSchema.index(
    { currentVerification: 1 },
    {
        unique: true,
        partialFilterExpression: {
            currentVerification: {
                $type: "objectId"
            }
        }
    }
);


/*
 * Organizational scope filtering.
 */
ProjectSchema.index({
    workspace: 1
});

ProjectSchema.index({
    organization: 1
});


/*
 * Common project filters.
 */
ProjectSchema.index({
    leadPI: 1
});

ProjectSchema.index({
    grant: 1
});

ProjectSchema.index({
    call: 1
});

ProjectSchema.index({
    calendar: 1
});

ProjectSchema.index({
    status: 1
});


export const Project = model<IProject>(
    COLLECTIONS.PROJECT,
    ProjectSchema
);