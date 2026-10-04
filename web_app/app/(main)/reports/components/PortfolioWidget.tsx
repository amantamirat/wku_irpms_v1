// reports/components/PortfolioWidget.tsx
'use client';

import { Skeleton } from 'primereact/skeleton';
import { IPortfolioReport } from '../models/report.types';

interface PortfolioWidgetSkeletonProps {
  count?: number;
}

/**
 * Skeleton loader for Portfolio / Stat Widget layouts
 */
export function PortfolioWidgetSkeleton({ count = 7 }: PortfolioWidgetSkeletonProps) {
  return (
    <div className="grid">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="col-12 sm:col-6 lg:col-3">
          <div className="surface-card shadow-1 p-3 border-round-xl flex align-items-center justify-content-between">
            <div className="flex flex-column gap-2 w-full">
              <Skeleton width="60%" height="0.9rem" />
              <Skeleton width="40%" height="1.5rem" />
            </div>
            <Skeleton shape="circle" size="3rem" className="flex-shrink-0 ml-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface PortfolioWidgetProps {
  data?: IPortfolioReport;
  loading?: boolean;
}

/**
 * Portfolio Widget component with built-in loading state
 */
export const PortfolioWidget = ({ data, loading = false }: PortfolioWidgetProps) => {
  // Show skeleton if loading is true or if data is not yet available
  if (loading || !data) {
    return <PortfolioWidgetSkeleton />;
  }

  const cards = [
    {
      title: 'Total Projects',
      value: data.totalProjects ?? 0,
      icon: 'pi-folder',
      color: 'blue'
    },
    {
      title: 'Draft',
      value: data.draftProjects ?? 0,
      icon: 'pi-file',
      color: 'gray'
    },
    {
      title: 'Approved',
      value: data.approvedProjects ?? 0,
      icon: 'pi-check',
      color: 'green'
    },
    {
      title: 'Refused',
      value: data.refusedProjects ?? 0,
      icon: 'pi-times',
      color: 'red'
    },
    {
      title: 'Granted',
      value: data.grantedProjects ?? 0,
      icon: 'pi-send',
      color: 'orange'
    },
    {
      title: 'Completed',
      value: data.completedProjects ?? 0,
      icon: 'pi-check-circle',
      color: 'purple'
    },
    {
      title: 'Verified',
      value: data.verifiedProjects ?? 0,
      icon: 'pi-check',
      color: 'blue'
    },
    {
      title: 'Terminated',
      value: data.terminatedProjects ?? 0,
      icon: 'pi-ban',
      color: 'red'
    }
  ];

  return (
    <div className="grid">
      {cards.map((c, i) => (
        <div key={i} className="col-12 sm:col-6 lg:col-3">
          <div className="surface-card shadow-1 p-3 border-round-xl flex align-items-center justify-content-between">
            <div>
              <span className="text-500 font-medium text-sm block mb-1">{c.title}</span>
              <span className={`text-2xl font-bold text-${c.color}-600`}>{c.value}</span>
            </div>
            <div className={`bg-${c.color}-100 p-3 border-round flex align-items-center justify-content-center`} style={{ width: '2.5rem', height: '2.5rem' }}>
              <i className={`pi ${c.icon} text-${c.color}-600 text-xl`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};