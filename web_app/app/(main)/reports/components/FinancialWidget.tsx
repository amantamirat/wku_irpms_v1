// reports/components/FinancialWidget.tsx
'use client';

import { etbCurrencyFormatter } from "@/utils/utils";
import { IFinancialReport } from '../models/report.types';
import { ProgressBar } from 'primereact/progressbar';

interface Props {
  data?: IFinancialReport;
}

export const FinancialWidget = ({ data }: Props) => {
  if (!data) return null;

  const {
    totalGrantAmount = 0,
    usedGrantBudget = 0,
    committedGrantBudget = 0,
    unallocatedGrantBudget = 0,
    remainingGrantBudget = 0,
    utilizationRate = 0,
  } = data;

  // Dynamic color for progress bar based on utilization
  const getProgressBarColor = (rate: number) => {
    if (rate >= 90) return 'bg-red-500';
    if (rate >= 75) return 'bg-orange-500';
    return 'bg-green-500';
  };

  return (
    <div className="surface-card shadow-1 p-4 border-round-xl h-full flex flex-column justify-content-between">
      <div>
        {/* Header Section */}
        <div className="flex align-items-center justify-content-between mb-3">
          <h4 className="text-lg font-semibold text-800 m-0 flex align-items-center gap-2">
            <i className="pi pi-bitcoin text-green-500" />
            Financial Budget
          </h4>
          <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 border-round">
            Utilization: {utilizationRate}%
          </span>
        </div>

        {/* Progress Bar */}
        <ProgressBar 
          value={utilizationRate} 
          showValue={false} 
          className="h-1rem mb-4" 
        />
      </div>

      {/* Primary Financial Stats Grid */}
      <div className="grid text-center mb-3">
        <div className="col-4 border-right-1 surface-border">
          <div className="text-500 text-xs mb-1">Total Allocated</div>
          <div className="text-base font-bold text-900">{etbCurrencyFormatter.format(totalGrantAmount)}</div>
        </div>
        <div className="col-4 border-right-1 surface-border">
          <div className="text-500 text-xs mb-1">Used Budget</div>
          <div className="text-base font-bold text-orange-600">{etbCurrencyFormatter.format(usedGrantBudget)}</div>
        </div>
        <div className="col-4">
          <div className="text-500 text-xs mb-1">Remaining</div>
          <div className="text-base font-bold text-green-600">{etbCurrencyFormatter.format(remainingGrantBudget)}</div>
        </div>
      </div>

      {/* Secondary Budget Breakdown (Committed & Unallocated) */}
      <div className="surface-ground p-3 border-round flex justify-content-between align-items-center text-xs">
        <div>
          <span className="text-500 block mb-1">Committed</span>
          <span className="font-semibold text-700">{etbCurrencyFormatter.format(committedGrantBudget)}</span>
        </div>
        <div className="text-right">
          <span className="text-500 block mb-1">Unallocated</span>
          <span className="font-semibold text-700">{etbCurrencyFormatter.format(unallocatedGrantBudget)}</span>
        </div>
      </div>
    </div>
  );
};