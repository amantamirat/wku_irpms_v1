import { IRange, isValidRange } from "@/types/range";


export interface Constraint {
  _id?: string;

  name: string;
  description?: string;

  participants?: IRange;
  phases?: IRange;

  budget?: IRange;
  duration?: IRange;

  budgetPerPhase?: IRange;
  durationPerPhase?: IRange;

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
    ["Participants", constraint.participants],
    ["Phases", constraint.phases],
    ["Budget", constraint.budget],
    ["Duration", constraint.duration],
    ["Budget per phase", constraint.budgetPerPhase],
    ["Duration per phase", constraint.durationPerPhase],
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