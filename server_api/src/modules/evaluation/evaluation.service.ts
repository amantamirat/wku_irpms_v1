import Evaluation, { EvaluationType, IEvaluation } from './evaluation.model';
import Organization, { OrganizationType } from '../organizations/organization.model';
import { validateEvaluation } from './evaluation.validator';


export const validateEvaluationReferences = async (data: Partial<IEvaluation>) => {
    const { type, parent, directorate, weight_value } = data;

    const isEvaluation = type === EvaluationType.evaluation;
    const isValidation = type === EvaluationType.evaluation;
    const isStage = type === EvaluationType.stage;
    const isCriterion = type === EvaluationType.criterion;
    const isOption = type === EvaluationType.option;

    if (isEvaluation || isValidation) {
        if (parent) {
            throw new Error(`'${type}' must not include a 'parent'.`);
        }
        if (!directorate) throw new Error(`'${type}' requires a 'directorate'.`);
        const org = await Organization.findById(directorate);
        if (!org || org.type !== OrganizationType.Directorate) {
            throw new Error(`'directorate' must reference an organization of type 'Directorate'.`);
        }
    }
    if (isStage || isCriterion || isOption) {
        if (directorate) {
            throw new Error(`'${type}' must not include a 'directorate'.`);
        }
        if (!parent) throw new Error(`'${type}' requires a parent.`);

        const parentEval = await Evaluation.findById(parent);
        if (!parentEval) throw new Error(`Parent evaluation not found for '${type}'.`);

        const expectedParentType =
            isStage ? [EvaluationType.evaluation, EvaluationType.validation]
                : isCriterion ? EvaluationType.stage
                    : isOption ? EvaluationType.criterion : null;

        if (Array.isArray(expectedParentType)
            ? !expectedParentType.includes(parentEval.type)
            : parentEval.type !== expectedParentType) {
            throw new Error(
                `'${type}' must have a parent of type '${Array.isArray(expectedParentType) ? expectedParentType.join("' or '") : expectedParentType}'.`
            );
        }
        if (isOption) {
            if (!weight_value || !parentEval.weight_value) {
                throw new Error("Weight Value is Not Found");
            }
            if (weight_value > parentEval.weight_value) {
                throw new Error(`Value ${weight_value} must be less that or equal to weight ${parentEval.weight_value}`);
            }
        }
    }
};


// Create Evaluation
export const createEvaluation = async (data: Partial<IEvaluation>) => {
    try {
        const { error, value } = validateEvaluation(data);
        if (error) throw new Error(error.details.map(d => d.message).join(', '));

        await validateEvaluationReferences(value);

        const evaluation = await Evaluation.create(value);
        return { success: true, status: 201, data: evaluation };
    } catch (err: any) {
        console.error(err);
        return { success: false, status: 400, message: err.message };
    }
};

// Update Evaluation
export const updateEvaluation = async (id: string, data: Partial<IEvaluation>) => {
    try {
        const evaluation = await Evaluation.findById(id);
        if (!evaluation) {
            return { success: false, status: 404, message: 'Evaluation not found' };
        }
        const merged = { ...evaluation.toObject(), ...data };
        const { error, value } = validateEvaluation(merged);
        if (error) throw new Error(error.details.map(d => d.message).join(', '));
        await validateEvaluationReferences(value);

        Object.assign(evaluation, data);
        await evaluation.save();

        return { success: true, status: 200, data: evaluation };
    } catch (err: any) {
        return { success: false, status: 400, message: err.message };
    }
};

// Delete Evaluation
export const deleteEvaluation = async (id: string) => {
    const evaluation = await Evaluation.findById(id);
    if (!evaluation) {
        return { success: false, status: 404, message: 'Evaluation not found' };
    }

    await evaluation.deleteOne(); // Add pre-hook if needed
    return { success: true, status: 200, message: 'Evaluation deleted successfully' };
};

// Get by parent
export const getEvaluationsByParent = async (parentId: string) => {
    const items = await Evaluation.find({ parent: parentId })
        .sort({ createdAt: -1 })
        .lean();
    return { success: true, status: 200, data: items };
};

// Get by directorate
export const getEvaluationsByDirectorate = async (directorateId: string) => {
    const items = await Evaluation.find({ directorate: directorateId })
        .sort({ createdAt: -1 })
        .lean();
    return { success: true, status: 200, data: items };
};


export const reorderStage = async (id: string, direction: string) => {
    try {
        if (!['up', 'down'].includes(direction)) {
            throw new Error('Direction must be "up" or "down".');
        }
        const current = await Evaluation.findById(id);
        if (!current || current.type !== EvaluationType.stage) {
            throw new Error('Evaluation not found or not a stage.');
        }
        const level = current.stage_level;
        if (typeof level !== 'number') {
            throw new Error('Current stage level is not defined.');
        }
        const target = await Evaluation.findOne({
            parent: current.parent,
            stage_level: direction === 'up' ? level - 1 : level + 1
        });
        if (!target) {
            throw new Error(`Cannot move ${direction} any further.`);
        }
        const currentLevel = current.stage_level!;
        const targetLevel = target.stage_level!;

        await Evaluation.updateOne(
            { _id: current._id },
            { $set: { stage_level: -1 } },
            { runValidators: false } // Bypass min/max validation
        );
        // Swap stage levels using bulkWrite
        await Evaluation.bulkWrite([
            {
                updateOne: {
                    filter: { _id: current._id },
                    update: { $set: { stage_level: targetLevel} }
                }
            },
            {
                updateOne: {
                    filter: { _id: target._id },
                    update: { $set: { stage_level: currentLevel } }
                }
            }
        ]);
        return {
            success: true,
            status: 200,
            message: `Stage moved ${direction} successfully.`,
        };
    } catch (err: any) {
        console.error(err);
        return {
            success: false,
            status: 400,
            message: err.message || 'Failed to reorder stage.',
        };
    }
};
