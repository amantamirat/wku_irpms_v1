import { IRange, isValidRange } from "@/types/range";

export interface Constraint {
  _id?: string;

  name: string;
  description?: string;

  titleWords?: IRange;
  summaryWords?: IRange;

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

  phaseBudget?: IRange;
  phaseDuration?: IRange;

  activityDuration?: IRange;
  equipmentCost?: IRange;

  themes?: IRange;
  subThemes?: IRange;

  focusAreas?: IRange;
  indicators?: IRange;

  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export const validateConstraint = (
  constraint: Constraint
): { valid: boolean; message?: string } => {
  if (!constraint.name || constraint.name.trim() === "") {
    return {
      valid: false,
      message: "Constraint name is required.",
    };
  }

  const ranges: [string, IRange | undefined][] = [
    ["Title words", constraint.titleWords],
    ["Summary words", constraint.summaryWords],
    ["General objective words", constraint.generalObjectiveWords],
    ["Specific objective words", constraint.specificObjectiveWords],
    ["Specific objectives", constraint.specificObjectives],
    ["Expected outputs", constraint.expectedOutputs],
    ["Expected output words", constraint.expectedOutputWords],
    ["Participants", constraint.participants],
    ["Phases", constraint.phases],
    ["Budget", constraint.budget],
    ["Duration", constraint.duration],
    ["Phase budget", constraint.phaseBudget],             // was budgetPerPhase
    ["Phase duration", constraint.phaseDuration],         // was durationPerPhase
    ["Activity duration", constraint.activityDuration],   // added
    ["Equipment cost", constraint.equipmentCost],         // added
    ["Activities", constraint.activities],                // was activitiesPerPhase
    ["Equipments", constraint.equipments],                // was equipmentsPerPhase
    ["Components", constraint.components],                // added
    ["Themes", constraint.themes],
    ["Sub themes", constraint.subThemes],
    ["Focus areas", constraint.focusAreas],
    ["Indicators", constraint.indicators],
  ];

  for (const [name, range] of ranges) {
    if (range) {
      if (!isValidRange(range)) {
        if (range.min < 0 || range.max < 0) {
          return {
            valid: false,
            message: `${name} values cannot be negative.`,
          };
        }
        if (range.min > range.max) {
          return {
            valid: false,
            message: `Invalid range for ${name}. Minimum cannot exceed maximum.`,
          };
        }
        return {
          valid: false,
          message: `${name} contains invalid range numbers.`,
        };
      }
    }
  }

  return { valid: true };
};