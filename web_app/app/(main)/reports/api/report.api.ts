import { ApiClient } from "@/api/ApiClient";
import { IReportFilter, IDashboardReport, IPortfolioReport, IApplicationReport, IEvaluationReport, IDepartmentReport } from "../models/report.types";


const ENDPOINT = "/reports";

export const ReportApi = {
  /**
   * Get main dashboard metrics
   */
  async getDashboard(filter?: IReportFilter): Promise<IDashboardReport> {
    const data = await ApiClient.get(`${ENDPOINT}/dashboard`, {
      params: filter,
    });
    return data as IDashboardReport;
  },

  /**
   * Get portfolio report
   */
  async getPortfolio(filter?: IReportFilter): Promise<IPortfolioReport> {
    const data = await ApiClient.get(`${ENDPOINT}/portfolio`, {
      params: filter,
    });
    return data as IPortfolioReport;
  },

  /**
   * Get applications report
   */
  async getApplications(filter?: IReportFilter): Promise<IApplicationReport> {
    const data = await ApiClient.get(`${ENDPOINT}/applications`, {
      params: filter,
    });
    return data as IApplicationReport;
  },

  /**
   * Get evaluation report
   */
  async getEvaluation(filter?: IReportFilter): Promise<IEvaluationReport> {
    const data = await ApiClient.get(`${ENDPOINT}/evaluation`, {
      params: filter,
    });
    return data as IEvaluationReport;
  },

  /**
   * Get department metrics breakdown
   */
  async getDepartments(filter?: IReportFilter): Promise<IDepartmentReport> {
    const data = await ApiClient.get(`${ENDPOINT}/departments`, {
      params: filter,
    });
    return data as IDepartmentReport;
  },
};