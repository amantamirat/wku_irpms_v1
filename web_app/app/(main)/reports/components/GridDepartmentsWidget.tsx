'use client';
import { IDepartmentReport } from '../models/report.types';
import { SingleDepartmentWidget } from './SingleDepartmentWidget';

interface Props {
    departments?: IDepartmentReport[] | null;
    loading?: boolean;
}

export const GridDepartmentsWidget = ({
    departments,
    loading = false,
}: Props) => {
    const departmentList: IDepartmentReport[] = Array.isArray(departments)
        ? departments
        : [];

    if (loading) {
        return (
            <div className="surface-card shadow-2 p-5 border-round-2xl text-center">
                <i className="pi pi-spin pi-spinner text-primary text-2xl" />
                <span className="block text-600 text-sm mt-2">Loading department metrics...</span>
            </div>
        );
    }

    return (
        <div className="surface-card shadow-2 p-4 border-round-2xl h-full flex flex-column gap-4">
            {/* HEADER */}
            <div className="flex align-items-center justify-content-between">
                <div>
                    <h4 className="text-xl font-bold text-900 m-0 flex align-items-center gap-2">
                        <i className="pi pi-building text-primary text-xl" />
                        Department Performance Grid
                    </h4>
                    <span className="text-xs text-500 font-medium">
                        Visual overview of budget allocation and project distribution per department
                    </span>
                </div>

                <span className="text-xs font-bold text-primary-700 bg-primary-50 px-3 py-1.5 border-round-pill shadow-sm">
                    Total: {departmentList.length}
                </span>
            </div>

            {/* RESPONSIVE GRID */}
            {departmentList.length === 0 ? (
                <div className="text-center py-5 text-600 text-sm">
                    No department data available.
                </div>
            ) : (
                <div className="grid">
                    {departmentList.map((dept, index) => (
                        <div key={dept._id || index} className="col-12 sm:col-6 lg:col-4 mb-3">
                            <SingleDepartmentWidget department={dept} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};