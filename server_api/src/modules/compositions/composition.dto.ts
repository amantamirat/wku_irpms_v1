/* ---------------- RANGE ---------------- */
export interface IRangeDTO {
  min: number;
  max: number;
}

export interface CreateCompositionDTO {
  name: string;
  description?: string;
  // PI requirements
  leadProfileRule?: string;
  leadHistoryRule?: string;
  // Team member requirements
  memberRequirements: string[];
  userId?: string;
}


export interface UpdateCompositionDTO {
  id: string;
  data: Partial<CreateCompositionDTO>;
  userId?: string;
}

export interface GetCompositionDTO {
  populate?: boolean;

}