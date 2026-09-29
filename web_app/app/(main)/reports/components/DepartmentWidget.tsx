// reports/components/DepartmentWidget.tsx
'use client';

import { IDepartmentReport } from '../models/report.types';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

interface Props {
  departments?: IDepartmentReport[] | any;
  loading?: boolean;
}

export const DepartmentWidget = ({ departments, loading }: Props) => {
  // Ensure value passed to DataTable is always an array to prevent "data.slice is not a function"
  const tableData = Array.isArray(departments) 
    ? departments 
    : departments?.departments || departments?.items || (departments ? [departments] : []);

  return (
    <div className="surface-card shadow-2 p-4 border-round-2xl h-full flex flex-column justify-content-between transition-all transition-duration-200 hover:shadow-3">
      
      {/* HEADER */}
      <div className="flex align-items-center justify-content-between mb-3">
        <div>
          <h4 className="text-xl font-bold text-900 m-0 flex align-items-center gap-2">
            <i className="pi pi-building text-primary text-xl" />
            Department Metrics
          </h4>
          <span className="text-xs text-500 font-medium">Performance and project distribution</span>
        </div>
        <span className="text-xs font-bold text-primary-700 bg-primary-50 px-3 py-1.5 border-round-pill shadow-sm">
          Total: {Array.isArray(tableData) ? tableData.length : 0}
        </span>
      </div>

      {/* DATATABLE WRAPPER */}
      <div className="border-1 surface-border border-round-xl overflow-hidden mt-1">
        <DataTable 
          value={tableData} 
          loading={loading} 
          rows={5} 
          paginator={tableData.length > 5} 
          //responsiveLayout="scroll"
          emptyMessage="No department data available."
          className="p-datatable-sm"
        >
          <Column field="name" header="Department" sortable style={{ minWidth: '12rem' }} />
          <Column field="count" header="Active Projects" sortable style={{ minWidth: '10rem' }} />
        </DataTable>
      </div>

    </div>
  );
};