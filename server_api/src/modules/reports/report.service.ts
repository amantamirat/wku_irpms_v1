// report.service.ts

import { IReportFilter } from "./report.types";
import { ReportRepository } from "./report.repository";

export class ReportService {

    constructor(
        private readonly repository: ReportRepository
    ) { }

    async getDashboard(filter: IReportFilter) {

        return this.repository.getDashboard(filter);
    }

    async getPortfolio(filter: IReportFilter) {
        return this.repository.getPortfolio(filter);
    }

    async getApplications(filter: IReportFilter) {
        return this.repository.getApplications(filter);
    }

    async getEvaluation(filter: IReportFilter) {
        return this.repository.getEvaluation(filter);
    }

    async getFinancial(filter: IReportFilter) {
        return this.repository.getFinancial(filter);
    }

    async getPhases(filter: IReportFilter) {
        return this.repository.getPhases(filter);
    }

    async getDepartments(filter: IReportFilter) {
        return this.repository.getDepartments(filter);
    }

    /*
    async getFundingOrganizations(filter: IReportFilter) {
        return this.repository.getFundingOrganizations(filter);
    }*/
}