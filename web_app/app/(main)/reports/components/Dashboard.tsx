// modules/report/components/Dashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { ReportApi } from '../api/report.api';
import { IDashboardReport, IReportFilter } from '../models/report.types';

// Import all related widgets & skeletons
import { PortfolioWidget, PortfolioWidgetSkeleton } from './PortfolioWidget';
import { ApplicationWidget } from './ApplicationWidget';
import { EvaluationWidget } from './EvaluationWidget';
import { VerificationWidget } from './VerificationWidget';
import { ListDepartmentWidget } from './ListDepartmentWidget';
import { SingleDepartmentWidget } from './SingleDepartmentWidget'; // Make sure to import this

interface DashboardProps {
  filter?: IReportFilter;
  initialData?: IDashboardReport | null;
  loading?: boolean;
}

export const ReportDashboard = ({ filter, initialData, loading: externalLoading }: DashboardProps) => {
  const [report, setReport] = useState<IDashboardReport | null>(initialData || null);
  const [loading, setLoading] = useState<boolean>(externalLoading ?? !initialData);

  useEffect(() => {
    if (initialData) {
      setReport(initialData);
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const data = await ReportApi.getDashboard(filter);
        setReport(data);
      } catch (error) {
        console.error('Failed to load dashboard report:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [filter, initialData]);

  // 1. Show skeletons explicitly when loading is true
  if (loading) {
    return (
      <div className="flex flex-column gap-4">
        <PortfolioWidgetSkeleton />
        <div className="grid">
          <div className="col-12 lg:col-6"><ApplicationWidget loading={true} /></div>
          <div className="col-12 lg:col-6"><EvaluationWidget loading={true} /></div>
        </div>
        <div className="grid">
          <div className="col-12 lg:col-6"><VerificationWidget loading={true} /></div>
          <div className="col-12 lg:col-6"><ListDepartmentWidget loading={true} /></div>
        </div>
      </div>
    );
  }

  // 2. Show error/empty message only if loading is finished and there's no report data
  if (!report) {
    return (
      <div className="surface-card shadow-1 border-round-xl p-5 text-center text-500">
        <i className="pi pi-exclamation-triangle text-3xl mb-2 text-warning" />
        <p className="m-0">No dashboard data available for the selected filter.</p>
      </div>
    );
  }

  // Check if departments data is a single item or an array with length of 1
  const departmentsData = report?.departments;
  const isSingleDepartment = Array.isArray(departmentsData) 
    ? departmentsData.length === 1 
    : departmentsData != null; // Handle if it's a single object directly depending on your types

  return (
    <div className="flex flex-column gap-4">
      {/* 1. PORTFOLIO OVERVIEW */}
      <PortfolioWidget data={report?.portfolio} loading={false} />

      {/* 2. APPLICATIONS & EVALUATIONS */}
      <div className="grid">
        <div className="col-12 lg:col-6">
          <ApplicationWidget data={report?.applications} loading={false} />
        </div>
        <div className="col-12 lg:col-6">
          <EvaluationWidget data={report?.reviewers} loading={false} />
        </div>
      </div>

      {/* 3. VERIFICATIONS & DEPARTMENTS (Conditional check for single department) */}
      <div className="grid">
        <div className="col-12 lg:col-6">
          <VerificationWidget data={report?.verifications} loading={false} />
        </div>
        <div className="col-12 lg:col-6">
          {Array.isArray(departmentsData) && departmentsData.length === 1 ? (
            <SingleDepartmentWidget department={departmentsData[0]} loading={false} />
          ) : (
            <ListDepartmentWidget departments={departmentsData} loading={false} />
          )}
        </div>
      </div>
    </div>
  );
};