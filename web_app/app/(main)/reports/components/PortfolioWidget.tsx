// reports/components/PortfolioWidget.tsx
'use client';

import { IPortfolioReport } from '../models/report.types';

interface Props {
  data?: IPortfolioReport;
}

export const PortfolioWidget = ({ data }: Props) => {
  const cards = [
    { title: 'Total Projects', value: data?.totalProjects ?? 0, icon: 'pi-folder', color: 'blue' },
    { title: 'Active', value: data?.activeProjects ?? 0, icon: 'pi-sync', color: 'green' },
    { title: 'Completed', value: data?.completedProjects ?? 0, icon: 'pi-check-circle', color: 'purple' },
    { title: 'Terminated', value: data?.terminatedProjects ?? 0, icon: 'pi-times-circle', color: 'red' },
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