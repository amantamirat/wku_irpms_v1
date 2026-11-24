// report.service.ts
import { IReportFilter } from "./report.types";
import { buildProjectMatch, ReportRepository } from "./report.repository";
import { AuthScope } from "../auth/auth.types";
import ScopeFilterService from "../../common/services/scope-filter.service";

export class ReportService {

    constructor(
        private readonly repository: ReportRepository,
        private readonly scopeFilterService: ScopeFilterService,
    ) { }

    async getDashboard(filter: IReportFilter, scope: AuthScope) {
        const scopeFilter =
            this.scopeFilterService.getProjectFilter(scope);
        return this.repository.getDashboard(filter, scopeFilter);
    }

    async getPortfolio(filter: IReportFilter) {
        const projectMatch = buildProjectMatch(filter);
        return this.repository.getPortfolio(projectMatch);
    }

    async getApplications(filter: IReportFilter) {
        return this.repository.getApplications(filter);
    }

    async getEvaluations(filter: IReportFilter) {
        return this.repository.getReviewerReport(filter);
    }

    async getVerifications(filter: IReportFilter) {
        const projectMatch = buildProjectMatch(filter);
        return this.repository.getVerificationReport(projectMatch);
    }

    async getDepartments(filter: IReportFilter) {
        const projectMatch = buildProjectMatch(filter);
        return this.repository.getDepartmentReport(projectMatch);
    }

    ////////////////////////////////////////////////////////////////////

    async getDirectorateReport(filter?: IReportFilter) {
        const directorateReport = await this.repository.getDirectorateReport();
        //console.log(directorateReport);
        return directorateReport;
    }

    async getFinancial(filter?: IReportFilter) {
        return this.repository.getFinancial(filter);
    }

    /////////////////////////////////////////////////
    async getPhases(filter: IReportFilter) {
        return this.repository.getPhases(filter);
    }

    async getResercherReport(filter: IReportFilter) {
        const projectMatch = buildProjectMatch(filter);
        return this.repository.getResearcherReport(projectMatch);
    }
    /*
    async getFundingOrganizations(filter: IReportFilter) {
        return this.repository.getFundingOrganizations(filter);
    }*/
}