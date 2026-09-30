///report/report.types.ts

import { FundingSource } from "../../grants/models/grant.model";

export interface IReportFilter {
  dateFrom?: Date;
  dateTo?: Date;

  grant?: string;
  call?: string;
  workspace?: string;
  organization?: string;
  calendar?: string;

  fundingSource?: FundingSource;
}


export interface IDashboardReport {
  portfolio: IPortfolioReport;
  applications: IApplicationReport;
  reviewers: IReviewersReport;
  verifications: IVerificationReport;
  departments: IDepartmentReport[];
}


export interface IPortfolioReport {
  totalProjects: number;
  draftProjects: number;
  approvedProjects: number;
  refusedProjects: number;
  grantedProjects: number;
  completedProjects: number;
  terminatedProjects: number;
}

export interface IApplicationReport {
  total: number;
  submitted: number;
  shortlisted: number;
  notShortlisted: number;
  accepted: number;
  rejected: number;
  shortlistingRate: number;
  acceptanceRate: number;
  averageScore: number | null;
}

export interface IVerificationReport {
  totalVerifications: number;
  submittedVerifications: number;
  verifiedVerifications: number;
  rejectedVerifications: number;
  verificationRate: number;          // percentage, 0-100
  rejectionRate: number;             // percentage, 0-100
  averageScore: number | null;       // null if no scores
  averageReviewTime: number | null;  // in days, null if nothing reviewed yet
  averageVerificationAttempts: number;
}

export interface IReviewersReport {
  totalReviews: number;
  completedReviews: number;
  pendingReviews: number;
  declinedReviews: number;
  rejectedReviews: number;
  completionRate: number;
  averageScore: number | null;
}


export interface IDepartmentReport {
  _id: string;
  name: string;
  projects: number;
  totalBudget: number;
  completed: number;
  approved: number;
  granted: number;
  terminated: number;
}


export interface IDirectorateFinancialReport {
  _id: string;
  name: string;

  allocated: number;
  committed: number;
  used: number;

  remaining: number;
  unallocated: number;

  utilization: number;
  commitmentRate: number;

  overCommitted: boolean;

  grantCount: number;
  projectCount: number;
}

export interface IFinancialReport {
  totalGrantAmount: number;        // total awarded
  usedGrantBudget: number;         // used
  committedGrantBudget: number;    // committed (approved but not yet spent)
  unallocatedGrantBudget: number;  // awarded - used - committed
  remainingGrantBudget: number;    // awarded - used (keep if other code uses it)
  utilizationRate: number;         // used / awarded * 100
  internalFunding: number;
  externalFunding: number;
}



////

export interface IPhaseReport {
  total: number;
  active: number;
  completed: number;
  terminated: number;
  completionRate: number;
}

export interface IOrganizationMetric {
  organization: string;
  name: string;
  count: number;
}


