import { ApiClient } from "@/api/ApiClient";
import { IReportFilter, IDashboardReport, IPortfolioReport, IApplicationReport, IReviewersReport, IVerificationReport, IFinancialReport, IDirectorateFinancialReport, IDepartmentReport } from "../models/report.types";


const ENDPOINT = "/reports";

export const ReportApi = {
  /**
   * Get main dashboard metrics
   */
  async getDashboard(filter?: IReportFilter): Promise<IDashboardReport> {
    const data = await ApiClient.get(`${ENDPOINT}/dashboard`, filter);
    return data as IDashboardReport;
  },

  /**
   * Get portfolio report
   */
  async getPortfolio(filter?: IReportFilter): Promise<IPortfolioReport> {
    const data = await ApiClient.get(`${ENDPOINT}/portfolio`, filter);
    return data as IPortfolioReport;
  },

  /**
   * Get applications report
   */
  async getApplications(filter?: IReportFilter): Promise<IApplicationReport> {
    const data = await ApiClient.get(`${ENDPOINT}/applications`, filter);
    return data as IApplicationReport;
  },

  /**
   * Get verifications report
   */
  async getVerifications(filter?: IReportFilter): Promise<IVerificationReport> {
    const data = await ApiClient.get(`${ENDPOINT}/verifications`, filter);
    return data as IVerificationReport;
  },

  /**
   * Get evaluation report
   */
  async getEvaluations(filter?: IReportFilter): Promise<IReviewersReport> {
    const data = await ApiClient.get(`${ENDPOINT}/evaluations`, filter);
    return data as IReviewersReport;
  },

  /**
   * Get department metrics breakdown
   */
  async getDepartmentReport(filter?: IReportFilter): Promise<IDepartmentReport[]> {
    const data = await ApiClient.get(`${ENDPOINT}/departments`, filter);
    return data as IDepartmentReport[];
  },

  ////////////
  /**
  * Get directorateReport metrics breakdown
  */
  async getDirectorateReport(filter?: IReportFilter): Promise<IDirectorateFinancialReport> {
    const data = await ApiClient.get(`${ENDPOINT}/directorates`, {
      params: filter,
    });
    return data as IDirectorateFinancialReport;
  },


  /**
   * Get evaluation report
   */
  async getFinancial(filter?: IReportFilter): Promise<IFinancialReport> {
    const data = await ApiClient.get(`${ENDPOINT}/financial`, {
      params: filter,
    });
    return data as IFinancialReport;
  },


};