'use client';

import { IDepartmentReport } from '../models/report.types';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

interface Props {
  departments?: IDepartmentReport;
  loading?: boolean;
}

export const DepartmentWidget = ({ departments, loading }: Props) => {
  return (
    <div className="surface-card shadow-1 p-4 border-round-xl h-full">
      <h4 className="text-lg font-semibold text-800 m-0 mb-3">
        <i className="pi pi-building text-blue-500 mr-2" />
        Department Metrics
      </h4>
      <DataTable value={departments} loading={loading} rows={5} paginator responsiveLayout="scroll">
        <Column field="name" header="Department" sortable />
        <Column field="count" header="Active Projects" sortable />
      </DataTable>
    </div>
  );
};