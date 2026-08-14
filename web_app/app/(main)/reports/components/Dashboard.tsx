// modules/report/components/Dashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import { Skeleton } from 'primereact/skeleton';
import { IDashboardReport, IReportFilter } from '../models/report.types';
import { ReportApi } from '../api/report.api';

// Import your standalone widgets
import { PortfolioWidget } from './PortfolioWidget';
import { FinancialWidget } from './FinancialWidget';
import { ApplicationWidget } from './ApplicationWidget';

interface DashboardProps {
  filter?: IReportFilter;
  /** Pass data directly if already fetched by parent, otherwise fetched via filter */
  initialData?: IDashboardReport | null;
  loading?: boolean;
}

export const ReportDashboard = ({ filter, initialData, loading: externalLoading }: DashboardProps) => {
  const [report, setReport] = useState<IDashboardReport | null>(initialData || null);
  const [loading, setLoading] = useState<boolean>(externalLoading ?? !initialData);

  useEffect(() => {
    if (initialData) {
      setReport(initialData);
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

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!report) {
    return (
      <div className="surface-card shadow-1 border-round-xl p-5 text-center text-500">
        <i className="pi pi-exclamation-triangle text-3xl mb-2 text-warning" />
        <p className="m-0">No dashboard data available for the selected filter.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-column gap-4">
      {/* 1. PORTFOLIO WIDGET */}
      <PortfolioWidget data={report.portfolio} />

      {/* 2. FINANCIAL & APPLICATIONS GRID */}
      <div className="grid">
        <div className="col-12 lg:col-6">
          <FinancialWidget data={report.financial} />
        </div>
        <div className="col-12 lg:col-6">
          <ApplicationWidget data={report.applications} loading={loading} />
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * LOADING SKELETON
 * ============================================================================ */
const DashboardSkeleton = () => (
  <div className="flex flex-column gap-4">
    {/* Skeleton for Portfolio */}
    <div className="grid">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="col-12 sm:col-6 lg:col-3">
          <div className="surface-card p-3 border-round-xl shadow-1">
            <Skeleton width="50%" className="mb-2" />
            <Skeleton width="80%" height="2rem" />
          </div>
        </div>
      ))}
    </div>

    {/* Skeleton for Financial and Applications */}
    <div className="grid">
      <div className="col-12 lg:col-6">
        <div className="surface-card p-4 border-round-xl shadow-1 h-18rem">
          <Skeleton width="40%" className="mb-3" />
          <Skeleton width="100%" height="11rem" />
        </div>
      </div>
      <div className="col-12 lg:col-6">
        <div className="surface-card p-4 border-round-xl shadow-1 h-18rem">
          <Skeleton width="40%" className="mb-3" />
          <Skeleton width="100%" height="11rem" />
        </div>
      </div>
    </div>
  </div>
);