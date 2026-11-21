import mongoose, { Schema, Document } from "mongoose";
import { COLLECTIONS } from "../../common/constants/collections.enum";
import { IRange } from "../../common/types/range";
import { RangeSchema } from "../../common/schemas/range.schema";

// ---------------------------------------------------------------------------
// New interfaces (grouped by entity)
// ---------------------------------------------------------------------------

export interface IProjectConstraints {
    // Text length
    titleWords?: IRange;
    summaryWords?: IRange;
    keyWords?: IRange;

    // Objectives
    generalObjectiveWords?: IRange;
    specificObjectiveWords?: IRange;
    specificObjectives?: IRange;

    // Expected outputs
    expectedOutputs?: IRange;
    expectedOutputWords?: IRange;

    // Budget & time
    budget?: IRange;
    duration?: IRange;

    // Classification
    themes?: IRange;
}

export interface ICollaboratorConstraints {
    members?: IRange; // was participants
}

export interface IPhaseConstraints {
    phases?: IRange; // number of phases
    budget?: IRange; // was phaseBudget
    duration?: IRange; // was phaseDuration
}

export interface IActivityConstraints {
    activities?: IRange; // number of activities
    cost?: IRange; // was activityCost
    duration?: IRange; // was activityDuration
}

export interface IEquipmentConstraints {
    equipments?: IRange; // number of equipments
    cost?: IRange; // was equipmentCost
}

export interface IComponentConstraints {
    components?: IRange; // number of components
    collaborators?: IRange; // was componentCollaborators
}

export interface IConstraint extends Document {
    name: string;
    description?: string;

    projectConstraints?: IProjectConstraints;
    collaboratorConstraints?: ICollaboratorConstraints;
    phaseConstraints?: IPhaseConstraints;
    activityConstraints?: IActivityConstraints;
    equipmentConstraints?: IEquipmentConstraints;
    componentConstraints?: IComponentConstraints;

    createdAt?: Date;
    updatedAt?: Date;

    ////////////////////// old content //////////////////////

    titleWords?: IRange;
    summaryWords?: IRange;
    keyWords?: IRange;

    // Objectives
    generalObjectiveWords?: IRange;
    specificObjectiveWords?: IRange;
    specificObjectives?: IRange;

    // Expected Outputs
    expectedOutputs?: IRange;
    expectedOutputWords?: IRange;

    // Project structure
    participants?: IRange;
    phases?: IRange;
    budget?: IRange;
    duration?: IRange;

    activities?: IRange;
    equipments?: IRange;

    components?: IRange;
    componentCollaborators?: IRange;

    phaseBudget?: IRange;
    phaseDuration?: IRange;

    activityCost?: IRange;
    activityDuration?: IRange;
    equipmentCost?: IRange;

    themes?: IRange;
    subThemes?: IRange;

    focusAreas?: IRange;
    indicators?: IRange;
}

// ---------------------------------------------------------------------------
// New sub-schemas
// ---------------------------------------------------------------------------

const ProjectConstraintsSchema = new Schema<IProjectConstraints>(
    {
        // Text length
        titleWords: { type: RangeSchema },
        summaryWords: { type: RangeSchema },
        keyWords: { type: RangeSchema },

        // Objectives
        generalObjectiveWords: { type: RangeSchema },
        specificObjectiveWords: { type: RangeSchema },
        specificObjectives: { type: RangeSchema },

        // Expected outputs
        expectedOutputs: { type: RangeSchema },
        expectedOutputWords: { type: RangeSchema },

        // Budget & time
        budget: { type: RangeSchema },
        duration: { type: RangeSchema },

        // Classification
        themes: { type: RangeSchema },
    },
    { _id: false }
);

const CollaboratorConstraintsSchema = new Schema<ICollaboratorConstraints>(
    {
        members: { type: RangeSchema },
    },
    { _id: false }
);

const PhaseConstraintsSchema = new Schema<IPhaseConstraints>(
    {
        phases: { type: RangeSchema },
        budget: { type: RangeSchema },
        duration: { type: RangeSchema },
    },
    { _id: false }
);

const ActivityConstraintsSchema = new Schema<IActivityConstraints>(
    {
        activities: { type: RangeSchema },
        cost: { type: RangeSchema },
        duration: { type: RangeSchema },
    },
    { _id: false }
);

const EquipmentConstraintsSchema = new Schema<IEquipmentConstraints>(
    {
        equipments: { type: RangeSchema },
        cost: { type: RangeSchema },
    },
    { _id: false }
);

const ComponentConstraintsSchema = new Schema<IComponentConstraints>(
    {
        components: { type: RangeSchema },
        collaborators: { type: RangeSchema },
    },
    { _id: false }
);

// ---------------------------------------------------------------------------
// Main schema
// ---------------------------------------------------------------------------

const ConstraintSchema = new Schema<IConstraint>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },

        description: {
            type: String,
            trim: true,
        },

        projectConstraints: { type: ProjectConstraintsSchema },
        collaboratorConstraints: { type: CollaboratorConstraintsSchema },
        phaseConstraints: { type: PhaseConstraintsSchema },
        activityConstraints: { type: ActivityConstraintsSchema },
        equipmentConstraints: { type: EquipmentConstraintsSchema },
        componentConstraints: { type: ComponentConstraintsSchema },

        ////////////////////// old content //////////////////////
        titleWords: {
            type: RangeSchema,
        },

        summaryWords: {
            type: RangeSchema,
        },

        keyWords: {
            type: RangeSchema,
        },

        // Objectives
        generalObjectiveWords: {
            type: RangeSchema,
        },

        specificObjectiveWords: {
            type: RangeSchema,
        },

        specificObjectives: {
            type: RangeSchema,
        },

        // Expected Outputs
        expectedOutputs: {
            type: RangeSchema,
        },

        expectedOutputWords: {
            type: RangeSchema,
        },

        // Project structure
        participants: {
            type: RangeSchema,
        },

        phases: {
            type: RangeSchema,
        },

        budget: {
            type: RangeSchema,
        },

        duration: {
            type: RangeSchema,
        },

        activities: {
            type: RangeSchema,
        },

        equipments: {
            type: RangeSchema,
        },

        components: {
            type: RangeSchema,
        },

        componentCollaborators: {
            type: RangeSchema,
        },

        phaseBudget: {
            type: RangeSchema,
        },

        phaseDuration: {
            type: RangeSchema,
        },

        activityCost: {
            type: RangeSchema,
        },

        activityDuration: {
            type: RangeSchema,
        },

        equipmentCost: {
            type: RangeSchema,
        },

        themes: {
            type: RangeSchema,
        },

        subThemes: {
            type: RangeSchema,
        },

        focusAreas: {
            type: RangeSchema,
        },

        indicators: {
            type: RangeSchema,
        },
    },
    {
        timestamps: true,
    }
);

export const Constraint = mongoose.model<IConstraint>(
    COLLECTIONS.CONSTRAINT,
    ConstraintSchema
);