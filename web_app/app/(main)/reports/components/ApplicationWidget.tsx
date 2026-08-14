// reports/components/ApplicationWidget.tsx
'use client';

import { useState, useEffect } from 'react';
import { Chart } from 'primereact/chart';
import { Skeleton } from 'primereact/skeleton';
import { IApplicationReport } from '../models/report.types';

interface Props {
  data?: IApplicationReport;
  loading?: boolean;
}

export const ApplicationWidget = ({ data, loading }: Props) => {
  const [chartData, setChartData] = useState({});
  const [chartOptions, setChartOptions] = useState({});

  useEffect(() => {
    if (!data) return;

    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color') || '#495057';

    // Doughnut chart showing status distribution
    setChartData({
      labels: ['Accepted', 'Pending', 'Rejected'],
      datasets: [
        {
          data: [data.accepted, data.pending, data.rejected],
          backgroundColor: ['#22C55E', '#F59E0B', '#EF4444'], // Green, Amber, Red
          hoverBackgroundColor: ['#4ADE80', '#FBBF24', '#F87171'],
        },
      ],
    });

    setChartOptions({
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: textColor, usePointStyle: true, padding: 15 },
        },
      },
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
    });
  }, [data]);

  if (loading) {
    return (
      <div className="surface-card shadow-1 p-4 border-round-xl h-full">
        <Skeleton width="50%" className="mb-3" />
        <Skeleton width="100%" height="180px" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="surface-card shadow-1 p-4 border-round-xl h-full flex flex-column justify-content-between">
      {/* HEADER */}
      <div className="flex align-items-center justify-content-between mb-3">
        <h4 className="text-lg font-semibold text-800 m-0 flex align-items-center gap-2">
          <i className="pi pi-file-edit text-primary" />
          Application Analytics
        </h4>
        <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 border-round">
          Total: {data.total}
        </span>
      </div>

      {/* KPI METRIC HIGHLIGHTS */}
      <div className="grid mb-3">
        <div className="col-6">
          <div className="surface-50 p-3 border-round-lg text-center">
            <div className="text-500 text-xs font-medium mb-1">Acceptance Rate</div>
            <div className="text-xl font-bold text-green-600">
              {data.acceptanceRate}%
            </div>
          </div>
        </div>

        <div className="col-6">
          <div className="surface-50 p-3 border-round-lg text-center">
            <div className="text-500 text-xs font-medium mb-1">Avg. Score</div>
            <div className="text-xl font-bold text-indigo-600">
              {data.averageScore !== null && data.averageScore !== undefined
                ? data.averageScore.toFixed(1)
                : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* CHART & BREAKDOWN */}
      <div className="grid align-items-center">
        {/* Doughnut Chart */}
        <div className="col-12 sm:col-6 flex justify-content-center">
          <div style={{ position: 'relative', width: '100%', height: '170px' }}>
            <Chart type="doughnut" data={chartData} options={chartOptions} style={{ height: '100%' }} />
          </div>
        </div>

        {/* Status Count Breakdown */}
        <div className="col-12 sm:col-6 flex flex-column gap-2">
          <div className="flex align-items-center justify-content-between p-2 surface-0 border-round border-left-3 border-green-500 shadow-1">
            <span className="text-sm text-700 flex align-items-center gap-2">
              <i className="pi pi-check-circle text-green-500" /> Accepted
            </span>
            <span className="font-bold text-green-600">{data.accepted}</span>
          </div>

          <div className="flex align-items-center justify-content-between p-2 surface-0 border-round border-left-3 border-amber-500 shadow-1">
            <span className="text-sm text-700 flex align-items-center gap-2">
              <i className="pi pi-clock text-amber-500" /> Pending
            </span>
            <span className="font-bold text-amber-600">{data.pending}</span>
          </div>

          <div className="flex align-items-center justify-content-between p-2 surface-0 border-round border-left-3 border-red-500 shadow-1">
            <span className="text-sm text-700 flex align-items-center gap-2">
              <i className="pi pi-times-circle text-red-500" /> Rejected
            </span>
            <span className="font-bold text-red-600">{data.rejected}</span>
          </div>
        </div>
      </div>
    </div>
  );
};