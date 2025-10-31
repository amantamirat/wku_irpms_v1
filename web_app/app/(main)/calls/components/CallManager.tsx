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
import { CallApi } from '../api/call.api';
import { Call, CallStatus } from '../models/call.model';
import SaveDialog from './SaveDialog';


const CallManager = () => {

    const emptyCall: Call = {
        directorate: '',
        title: '',
        deadline: new Date(),
        grant: '',
        theme: '',
        //evaluation: '',
        status: CallStatus.planned,
    };

    const [calls, setCalls] = useState<Call[]>([]);
    const [error, setError] = useState<string | null>(null);
    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [selectedCall, setSelectedCall] = useState<Call>(emptyCall);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [expandedRows, setExpandedRows] = useState<any[] | DataTableExpandedRows>([]);
    const toast = useRef<Toast>(null);


    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };

    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
    }, []);

    useEffect(() => {
        const fetchCalls = async () => {
            try {
                const data = await CallApi.getUserCalls();
                setCalls(data);
            } catch (err) {
                setError("Failed to fetch calls:" + err);
            }
        }
        fetchCalls();
    }, []);

    if (error) {
        return (
            <ErrorComponent errorMessage={error} />
        );
    }

    const onSaveComplete = (savedCall: Call) => {
        let _calls = [...calls];
        const index = _calls.findIndex((c) => c._id === savedCall._id);
        if (index !== -1) {
            _calls[index] = { ...savedCall };
        } else {
            _calls.push({ ...savedCall });
        }
        setCalls(_calls);
        hideDialogs();
    };

    const deleteCall = async () => {
        const deleted = await CallApi.deleteCall(selectedCall);
        if (deleted) {
            setCalls(calls.filter((c) => c._id !== selectedCall._id));
            hideDialogs();
        }
    };

    const hideDialogs = () => {
        setShowSaveDialog(false);
        setShowDeleteDialog(false);
        setSelectedCall(emptyCall);
    }

    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button label="New Call" icon="pi pi-plus" severity="success" className="mr-2"
                onClick={() => {
                    setSelectedCall(emptyCall);
                    setShowSaveDialog(true);
                }}
            />
        </div>
    );

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Manage Calls</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" value={globalFilter} onChange={onGlobalFilterChange} placeholder="Search..." className="w-full md:w-1/3" />
            </span>
        </div>
    );

    const actionBodyTemplate = (rowData: Call) => (
        <>
            <Button icon="pi pi-pencil" rounded severity="success" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setSelectedCall(rowData);
                    setShowSaveDialog(true);
                }} />
            <Button icon="pi pi-trash" rounded severity="warning" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setSelectedCall(rowData);
                    setShowDeleteDialog(true);
                }} />
        </>
    );

    const statusBodyTemplate = (rowData: Call) => {
        return (
            <>
                <span className="p-column-title">Status</span>
                <span className={`call-badge status-${rowData.status}`}>{rowData.status}</span>
            </>
        );
    };

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" start={startToolbarTemplate}></Toolbar>
                    <DataTable
                        ref={dt}
                        value={calls}
                        selection={selectedCall}
                        onSelectionChange={(e) => setSelectedCall(e.value as Call)}
                        dataKey="_id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} calls"
                        globalFilter={globalFilter}
                        emptyMessage="No call data found."
                        header={header}
                        scrollable
                        filters={filters}
                    /*
                    expandedRows={expandedRows}
                    onRowToggle={(e) => setExpandedRows(e.data)}
                    rowExpansionTemplate={(rowData: Call) => (
                        <ProjectManager call={rowData} />
                    )} */
                    >
                        {
                            <Column selectionMode="single" style={{ width: '3em' }} />
                            //<Column expander style={{ width: '3em' }} />
                        }
                        <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                        <Column field="calendar.year" header="Calendar" sortable />
                        <Column field="directorate.name" header="Directorate" sortable />
                        <Column field="title" header="Title" sortable />
                        <Column field="deadline" header="Deadline" body={(rowData) => new Date(rowData.deadline!).toLocaleDateString('en-CA')} />
                        <Column field="grant.title" header="Grant" sortable />
                        <Column field="theme.title" header="Theme" sortable />
                        <Column header="Status" body={statusBodyTemplate} sortable />
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
                    </DataTable>

                    {selectedCall && (
                        <SaveDialog
                            visible={showSaveDialog}
                            call={selectedCall}
                            onComplete={onSaveComplete}
                            onHide={hideDialogs}
                        />
                    )}

                    {selectedCall && (
                        <ConfirmDialog
                            showDialog={showDeleteDialog}
                            selectedDataInfo={String(selectedCall.title)}
                            onConfirmAsync={deleteCall}
                            onHide={hideDialogs}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default CallManager;
