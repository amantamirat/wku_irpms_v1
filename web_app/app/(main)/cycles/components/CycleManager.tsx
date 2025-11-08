'use client';

import ConfirmDialog from '@/components/ConfirmationDialog';
import ErrorComponent from '@/components/ErrorComponent';
import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableExpandedRows, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import { CycleApi } from '../services/cycle.api';
import { Cycle, CycleStatus, CycleType } from '../models/cycle.model';
import SaveCycle from './SaveCycle';
//import StageManager from './StageManager';
import Badge from '@/templates/Badge';

interface CycleManagerProps {
    type: CycleType; // "CALL" or "PROGRAM"
}

const CycleManager: React.FC<CycleManagerProps> = ({ type }) => {

    const emptyCycle: Cycle = {
        title: '',
        grant: '',
        calendar: '',
        theme: '',
        status: CycleStatus.planned,
        type: type,
        organization: '' // added for unified organization field
    };

    const [cycles, setCycles] = useState<Cycle[]>([]);
    const [error, setError] = useState<string | null>(null);
    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [selectedCycle, setSelectedCycle] = useState<Cycle>(emptyCycle);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [expandedRows, setExpandedRows] = useState<any[] | DataTableExpandedRows>([]);
    const toast = useRef<Toast>(null);

    // ----------------------------
    // Filtering setup
    // ----------------------------
    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };

    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
    }, []);

    // ----------------------------
    // Fetch cycles
    // ----------------------------
    useEffect(() => {
        const fetchCycles = async () => {
            try {
                const data = await CycleApi.getCycles({ user: true, type:type });
                setCycles(data);
            } catch (err) {
                setError("Failed to fetch " + type.toLowerCase() + " cycles: " + err);
            }
        };
        fetchCycles();
    }, [type]);

    if (error) {
        return <ErrorComponent errorMessage={error} />;
    }

    // ----------------------------
    // Handlers
    // ----------------------------
    const onSaveComplete = (savedCycle: Cycle) => {
        let _cycles = [...cycles];
        const index = _cycles.findIndex((c) => c._id === savedCycle._id);
        if (index !== -1) {
            _cycles[index] = { ...savedCycle };
        } else {
            _cycles.push({ ...savedCycle });
        }
        setCycles(_cycles);
        hideDialogs();
    };

    const deleteCycle = async () => {
        const deleted = await CycleApi.deleteCycle(selectedCycle);
        if (deleted) {
            setCycles(cycles.filter((c) => c._id !== selectedCycle._id));
            hideDialogs();
        }
    };

    const hideDialogs = () => {
        setShowSaveDialog(false);
        setShowDeleteDialog(false);
        setSelectedCycle(emptyCycle);
    };

    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button
                label={`New ${type}`}
                icon="pi pi-plus"
                severity="success"
                className="mr-2"
                onClick={() => {
                    setSelectedCycle(emptyCycle);
                    setShowSaveDialog(true);
                }}
            />
        </div>
    );

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Manage {type}</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText
                    type="search"
                    value={globalFilter}
                    onChange={onGlobalFilterChange}
                    placeholder="Search..."
                    className="w-full md:w-1/3"
                />
            </span>
        </div>
    );

    const actionBodyTemplate = (rowData: Cycle) => (
        <>
            <Button
                icon="pi pi-pencil"
                rounded
                severity="success"
                className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }}
                onClick={() => {
                    setSelectedCycle(rowData);
                    setShowSaveDialog(true);
                }}
            />
            <Button
                icon="pi pi-trash"
                rounded
                severity="warning"
                className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }}
                onClick={() => {
                    setSelectedCycle(rowData);
                    setShowDeleteDialog(true);
                }}
            />
        </>
    );

    const statusBodyTemplate = (rowData: Cycle) => (
        <>
            <span className="p-column-title">Status</span>
            <Badge type="status" value={rowData.status ?? 'Unknown'} />
        </>
    );

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" start={startToolbarTemplate}></Toolbar>

                    <DataTable
                        ref={dt}
                        value={cycles}
                        selection={selectedCycle}
                        onSelectionChange={(e) => setSelectedCycle(e.value as Cycle)}
                        dataKey="_id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate={`Showing {first} to {last} of {totalRecords} ${type.toLowerCase()} cycles`}
                        globalFilter={globalFilter}
                        emptyMessage={`No ${type.toLowerCase()} data found.`}
                        header={header}
                        scrollable
                        filters={filters}
                        expandedRows={expandedRows}
                        onRowToggle={(e) => setExpandedRows(e.data)}

                    >
                        <Column expander style={{ width: '3em' }} />
                        <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                        <Column field="calendar.year" header="Calendar" sortable />
                        <Column field="organization.name" header={type === "Program" ? "Center" : "Directorate"} sortable />
                        <Column field="title" header="Title" sortable />
                        <Column field="grant.title" header="Grant" sortable />
                        <Column field="theme.title" header="Theme" sortable />
                        <Column header="Status" body={statusBodyTemplate} sortable />
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
                    </DataTable>

                    {selectedCycle && (
                        <SaveCycle
                            type={type}
                            visible={showSaveDialog}
                            cycle={selectedCycle}
                            onComplete={onSaveComplete}
                            onHide={hideDialogs}
                        />
                    )}

                    {selectedCycle && (
                        <ConfirmDialog
                            showDialog={showDeleteDialog}
                            title={String(selectedCycle.title)}
                            onConfirmAsync={deleteCycle}
                            onHide={hideDialogs}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default CycleManager;
