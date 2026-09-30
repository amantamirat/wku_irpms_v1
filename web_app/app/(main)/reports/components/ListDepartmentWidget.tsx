// reports/components/DepartmentWidget.tsx
'use client';

import { etbCurrencyFormatter } from '@/utils/utils';
import { IDepartmentReport } from '../models/report.types';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

interface Props {
  departments?: IDepartmentReport[] | null;
  loading?: boolean;
}

export const ListDepartmentWidget = ({
  departments,
  loading = false,
}: Props) => {
  const tableData: IDepartmentReport[] = Array.isArray(departments)
    ? departments
    : [];

  const budgetBodyTemplate = (rowData: IDepartmentReport) => {
    return (
      <span className="font-semibold text-900">
        {etbCurrencyFormatter.format(rowData.totalBudget ?? 0)}
      </span>
    );
  };

  const completedBodyTemplate = (rowData: IDepartmentReport) => {
    return (
      <span className="bg-green-50 text-green-700 px-2 py-1 border-round text-xs font-semibold">
        {rowData.completed ?? 0}
      </span>
    );
  };

  return (
    <div className="surface-card shadow-2 p-4 border-round-2xl h-full flex flex-column justify-content-between transition-all transition-duration-200 hover:shadow-3">

      {/* HEADER */}
      <div className="flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="text-xl font-bold text-900 m-0 flex align-items-center gap-2">
            <i className="pi pi-building text-primary text-xl" />
            Department Metrics
          </h4>

          <span className="text-xs text-500 font-medium">
            Performance, budget allocation, and project distribution
          </span>
        </div>

        <span className="text-xs font-bold text-primary-700 bg-primary-50 px-3 py-1.5 border-round-pill shadow-sm">
          Total: {tableData.length}
        </span>
      </div>

      {/* DATATABLE - Increased spacing with mt-3 */}
      <div className="border-1 surface-border border-round-xl overflow-hidden mt-3">
        <DataTable
          value={tableData}
          loading={loading}
          rows={5}
          paginator={tableData.length > 5}
          emptyMessage="No department data available."
          className="p-datatable-sm"
        >
          <Column
            field="name"
            header="Department"
            sortable
            style={{ minWidth: '11rem' }}
          />

          <Column
            field="projects"
            header="Projects"
            sortable
            style={{ minWidth: '8rem' }}
          />

          <Column
            field="totalBudget"
            header="Total Budget"
            body={budgetBodyTemplate}
            sortable
            style={{ minWidth: '10rem' }}
          />

          <Column
            field="completed"
            header="Completed"
            body={completedBodyTemplate}
            sortable
            style={{ minWidth: '7rem' }}
          />
        </DataTable>
      </div>
    </div>
  );
};