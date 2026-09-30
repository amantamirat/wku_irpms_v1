// reports/components/VerificationWidget.tsx
'use client';

import { useState, useEffect } from 'react';
import { Chart } from 'primereact/chart';
import { IVerificationReport } from '../models/report.types';
import { GridSkeleton } from '@/components/Skeletons';

interface Props {
  data?: IVerificationReport;
  loading?: boolean;
}

export const VerificationWidget = ({ data, loading }: Props) => {
  const [chartData, setChartData] = useState({});
  const [chartOptions, setChartOptions] = useState({});

  useEffect(() => {
    if (!data) return;

    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color') || '#495057';

    // Doughnut chart mapping submitted, verified, and rejected distributions
    setChartData({
      labels: ['Submitted', 'Verified', 'Rejected'],
      datasets: [
        {
          data: [
            data.submittedVerifications ?? 0, 
            data.verifiedVerifications ?? 0, 
            data.rejectedVerifications ?? 0
          ],
          backgroundColor: [
            '#3B82F6', // Blue (Submitted)
            '#22C55E', // Green (Verified)
            '#EF4444', // Red (Rejected)
          ],
          hoverBackgroundColor: [
            '#60A5FA',
            '#4ADE80',
            '#F87171',
          ],
          borderWidth: 2,
          borderColor: documentStyle.getPropertyValue('--surface-card') || '#ffffff',
        },
      ],
    });

    setChartOptions({
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: textColor,
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 12,
            font: { size: 10, weight: '500' }
          },
        },
      },
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
    });
  }, [data]);

  if (loading) {
    return <GridSkeleton />;
  }

  if (!data) return null;

  // Safe formatting helpers to prevent .toFixed crashes on undefined/null values
  const formatRate = (rate?: number) => {
    return typeof rate === 'number' && !isNaN(rate) ? rate.toFixed(2) : '0.00';
  };

  const formatScore = (score?: number | null) => {
    return typeof score === 'number' && !isNaN(score) ? score.toFixed(1) : 'N/A';
  };

  const formatReviewTime = (days?: number | null) => {
    return typeof days === 'number' && !isNaN(days) ? `${days.toFixed(1)}d` : 'N/A';
  };

  const formatAttempts = (attempts?: number) => {
    return typeof attempts === 'number' && !isNaN(attempts) ? attempts.toFixed(1) : '0.0';
  };

  return (
    <div className="surface-card shadow-2 p-4 border-round-2xl h-full flex flex-column justify-content-between transition-all transition-duration-200 hover:shadow-3">

      {/* HEADER */}
      <div className="flex align-items-center justify-content-between mb-3">
        <div>
          <h4 className="text-xl font-bold text-900 m-0 flex align-items-center gap-2">
            <i className="pi pi-verified text-primary text-xl" />
            Verification Analytics
          </h4>
          <span className="text-xs text-500 font-medium">Overview of review progression</span>
        </div>
        <span className="text-xs font-bold text-primary-700 bg-primary-50 px-3 py-1.5 border-round-pill shadow-sm">
          Total: {data.totalVerifications ?? 0}
        </span>
      </div>

      {/* KPI METRIC HIGHLIGHTS (4 Columns) */}
      <div className="grid mb-3">
        <div className="col-3">
          <div className="surface-50 p-2.5 border-round-xl text-center border-1 surface-border">
            <div className="text-500 text-xs font-medium mb-1">Ver. Rate</div>
            <div className="text-md font-bold text-green-600">
              {formatRate(data.verificationRate)}%
            </div>
          </div>
        </div>

        <div className="col-3">
          <div className="surface-50 p-2.5 border-round-xl text-center border-1 surface-border">
            <div className="text-500 text-xs font-medium mb-1">Rej. Rate</div>
            <div className="text-md font-bold text-red-600">
              {formatRate(data.rejectionRate)}%
            </div>
          </div>
        </div>

        <div className="col-3">
          <div className="surface-50 p-2.5 border-round-xl text-center border-1 surface-border">
            <div className="text-500 text-xs font-medium mb-1">Avg Score</div>
            <div className="text-md font-bold text-blue-600">
              {formatScore(data.averageScore)}
            </div>
          </div>
        </div>

        <div className="col-3">
          <div className="surface-50 p-2.5 border-round-xl text-center border-1 surface-border">
            <div className="text-500 text-xs font-medium mb-1">Avg Time</div>
            <div className="text-md font-bold text-indigo-600">
              {formatReviewTime(data.averageReviewTime)}
            </div>
          </div>
        </div>
      </div>

      {/* CHART & BREAKDOWN */}
      <div className="grid align-items-center">
        {/* Doughnut Chart */}
        <div className="col-12 lg:col-6 flex justify-content-center">
          <div style={{ position: 'relative', width: '100%', height: '180px' }}>
            <Chart type="doughnut" data={chartData} options={chartOptions} style={{ height: '100%' }} />
          </div>
        </div>

        {/* Status Count Breakdown & Additional Metrics */}
        <div className="col-12 lg:col-6 flex flex-column gap-2">

          <div className="flex align-items-center justify-content-between px-3 py-2 surface-0 border-round-lg border-left-3 border-blue-500 shadow-1">
            <span className="text-xs text-700 font-medium flex align-items-center gap-2">
              <i className="pi pi-send text-blue-500" /> Submitted
            </span>
            <span className="font-bold text-blue-600 text-sm">{data.submittedVerifications ?? 0}</span>
          </div>

          <div className="flex align-items-center justify-content-between px-3 py-2 surface-0 border-round-lg border-left-3 border-green-500 shadow-1">
            <span className="text-xs text-700 font-medium flex align-items-center gap-2">
              <i className="pi pi-check-circle text-green-500" /> Verified
            </span>
            <span className="font-bold text-green-600 text-sm">{data.verifiedVerifications ?? 0}</span>
          </div>

          <div className="flex align-items-center justify-content-between px-3 py-2 surface-0 border-round-lg border-left-3 border-red-500 shadow-1">
            <span className="text-xs text-700 font-medium flex align-items-center gap-2">
              <i className="pi pi-times-circle text-red-500" /> Rejected
            </span>
            <span className="font-bold text-red-600 text-sm">{data.rejectedVerifications ?? 0}</span>
          </div>

          <div className="flex align-items-center justify-content-between px-3 py-2 surface-0 border-round-lg border-left-3 border-indigo-500 shadow-1">
            <span className="text-xs text-700 font-medium flex align-items-center gap-2">
              <i className="pi pi-sync text-indigo-500" /> Avg Attempts
            </span>
            <span className="font-bold text-indigo-600 text-sm">{formatAttempts(data.averageVerificationAttempts)}</span>
          </div>

        </div>
      </div>

    </div>
  );
};