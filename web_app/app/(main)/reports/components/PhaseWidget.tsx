// reports/components/PhaseWidget.tsx
'use client';

import { useState, useEffect } from 'react';
import { Chart } from 'primereact/chart';
import { IPhaseReport } from '../models/report.types';

interface Props {
  data?: IPhaseReport;
  loading?: boolean;
}

export const PhaseWidget = ({ data, loading }: Props) => {
  const [chartData, setChartData] = useState({});
  const [chartOptions, setChartOptions] = useState({});

  useEffect(() => {
    if (!data) return;

    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color') || '#495057';
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border') || '#dfe6e9';

    setChartData({
      labels: ['Active', 'Completed', 'Terminated'],
      datasets: [
        {
          label: 'Phase Breakdown',
          backgroundColor: ['#42A5F5', '#66BB6A', '#EF5350'],
          data: [data.active, data.completed, data.terminated],
        },
      ],
    });

    setChartOptions({
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          ticks: { color: textColor },
          grid: { color: surfaceBorder, drawBorder: false },
        },
        y: {
          ticks: { color: textColor, precision: 0 },
          grid: { color: surfaceBorder, drawBorder: false },
        },
      },
      responsive: true,
      maintainAspectRatio: false,
    });
  }, [data]);

  return (
    <div className="surface-card shadow-1 p-4 border-round-xl h-full flex flex-column justify-content-between">
      <div className="flex align-items-center justify-content-between mb-3">
        <h4 className="text-lg font-semibold text-800 m-0 flex align-items-center gap-2">
          <i className="pi pi-sitemap text-indigo-500" />
          Phase Progress
        </h4>
        <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 border-round">
          {data?.completionRate ?? 0}% Complete
        </span>
      </div>

      <div style={{ position: 'relative', width: '100%', height: '220px' }}>
        <Chart type="bar" data={chartData} options={chartOptions} style={{ height: '100%' }} />
      </div>
    </div>
  );
};