// reports/components/FinancialWidget.tsx
'use client';

import { etbCurrencyFormatter } from '@/utils/currencyUtil';
import { IFinancialReport } from '../models/report.types';
import { ProgressBar } from 'primereact/progressbar';

interface Props {
  data?: IFinancialReport;
}

export const FinancialWidget = ({ data }: Props) => {
  if (!data) return null;

  return (
    <div className="surface-card shadow-1 p-4 border-round-xl h-full flex flex-column justify-content-between">
      <div>
        <div className="flex align-items-center justify-content-between mb-3">
          <h4 className="text-lg font-semibold text-800 m-0 flex align-items-center gap-2">
            <i className="pi pi-dollar text-green-500" />
            Financial Budget
          </h4>
          <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 border-round">
            Utilization: {data.utilizationRate}%
          </span>
        </div>

        <ProgressBar value={data.utilizationRate} showValue={false} className="h-1rem mb-4" />
      </div>

      <div className="grid text-center">
        <div className="col-4 border-right-1 surface-border">
          <div className="text-500 text-xs mb-1">Total Allocated</div>
          <div className="text-lg font-bold text-900">{etbCurrencyFormatter.format(data?.totalGrantAmount ?? 0)}</div>
        </div>
        <div className="col-4 border-right-1 surface-border">
          <div className="text-500 text-xs mb-1">Used Budget</div>
          <div className="text-lg font-bold text-orange-600">{etbCurrencyFormatter.format(data?.usedGrantBudget ?? 0)}
          </div>
        </div>
        <div className="col-4">
          <div className="text-500 text-xs mb-1">Remaining</div>
          <div className="text-lg font-bold text-green-600">
            {etbCurrencyFormatter.format(data?.remainingGrantBudget ?? 0)}
          </div>
        </div>
      </div>
    </div>
  );
};