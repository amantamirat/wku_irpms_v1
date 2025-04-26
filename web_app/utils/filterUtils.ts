import { DataTableFilterMeta } from "primereact/datatable";
import { FilterMatchMode } from "primereact/api";

// Initialize filters
export const initFilters = (): DataTableFilterMeta => {
    return {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
};

// Handle global filter change
export const handleGlobalFilterChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    filters: DataTableFilterMeta,
    setFilters: (filters: DataTableFilterMeta) => void,
    setGlobalFilter: (filter: string) => void
) => {
    const value = e.target.value;
    const _filters = { ...filters };
    (_filters['global'] as any).value = value;
    setFilters(_filters);
    setGlobalFilter(value);
};
