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

  keyWords?: IRange;

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

  activityCost?: IRange;
  activityDuration?: IRange;

  equipmentCost?: IRange;

  themes?: IRange;
  subThemes?: IRange;
  focusAreas?: IRange;
  indicators?: IRange;

  createdAt?: string | Date;
  updatedAt?: string | Date;
}

