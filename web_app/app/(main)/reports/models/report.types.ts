///report/report.types.ts

import { FundingSource } from "../../grants/models/grant.model";
import { ProjectStatus } from "../../projects/models/project.model";

export interface IReportFilter {
  dateFrom?: Date;
  dateTo?: Date;

  grant?: string;
  call?: string;

  fundingSource?: FundingSource;

  department?: string;
  college?: string;

  theme?: string;

  projectStatus?: ProjectStatus;
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

export interface IEvaluationReport {
  totalReviews: number;
  completedReviews: number;
  pendingReviews: number;
  declinedReviews: number;
  rejectedReviews: number;
  completionRate: number;
  averageScore: number | null;
}

export interface IFinancialReport {
  totalGrantAmount: number;
  usedGrantBudget: number;
  remainingGrantBudget: number;
  utilizationRate: number;
  internalFunding: number;
  externalFunding: number;
}

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

export type IDepartmentReport = IOrganizationMetric[];

export interface IDashboardReport {
  portfolio: IPortfolioReport;
  applications: IApplicationReport;
  evaluations: IEvaluationReport;
  //financial: IFinancialReport;
  //phases: IPhaseReport;
  //departments: IDepartmentReport;
}