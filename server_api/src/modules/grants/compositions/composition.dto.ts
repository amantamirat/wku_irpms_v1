import { Accessibility, Gender } from "../../users/user.model";
import { AcademicLevel } from "../../../common/constants/enums";
import { OperationMode, TargetScope } from "./composition.model";

/* ---------------- RANGE ---------------- */

export interface RangeDTO {
  min: number;
  max: number;
}

/* ---------------- PROFILE RULE ---------------- */

export interface ProfileRuleDTO {
  gender?: Gender;
  age?: RangeDTO;
  experienceYears?: RangeDTO;
  accessibility?: Accessibility[];
  academicLevels?: AcademicLevel[];
}

/* ---------------- PROJECT HISTORY RULE ---------------- */

export interface ProjectHistoryRuleDTO {
  submission?: RangeDTO;
  rejection?: RangeDTO;
  completion?: RangeDTO;
}

/* ---------------- CREATE DTO ---------------- */

export interface CreateCompositionDTO {
  grant: string;

  description: string;

  targetScope: TargetScope;

  profileRule?: ProfileRuleDTO;

  projectHistoryRule?: ProjectHistoryRuleDTO;

  mode?: OperationMode;

  threshold?: RangeDTO;
}

/* ---------------- UPDATE DTO ---------------- */

export interface UpdateCompositionDTO {
  id: string;

  data: Partial<CreateCompositionDTO>;

  userId: string;
}

/* ---------------- QUERY DTOS ---------------- */

export interface GetCompositionDTO {
  grant?: string;
  targetScope?: TargetScope;
  populate?: boolean;
}

export interface ExistsCompositionDTO {
  grant?: string;
}