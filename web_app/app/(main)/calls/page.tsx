'use client';

import DeleteDialog from '@/components/DeleteDialog';


import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import { Call, CallStatus } from './models/call.model';
import { CallApi } from './api/call.api';
import SaveDialog from './components/SaveDialog';
import { Calendar } from '@/models/calendar';
import { CalendarService } from '@/services/CalendarService';

const CallPage = () => {
    const emptyCall: Call = {
        calendar: '',
        directorate: '',
        title: '',
        dead_line: new Date(),
        status: CallStatus.planned,
    };

    const [calls, setCalls] = useState<Call[]>([]);
    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [selectedCall, setSelectedCall] = useState<Call>(emptyCall);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const toast = useRef<Toast>(null);

    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
        loadCalls();
        loadCalendars();
    }, []);

    const loadCalls = async () => {
        try {
            const data =  await CallApi.getCalls({});
            setCalls(data);
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to load call data',
                detail: '' + err,
                life: 3000
            });
        }
    };

    const loadCalendars = async () => {
        try {
            const data =  await CalendarService.getCalendars();
            setCalendars(data);
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to load calendars data',
                detail: '' + err,
                life: 3000
            });
        }
    };

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };

    const saveCall = async () => {
        try {
            let _calls = [...calls];
            if (selectedCall._id) {
                const updated = await CallApi.updateCall(selectedCall);
                const index = _calls.findIndex((c) => c._id === selectedCall._id);
                _calls[index] = updated;
            } else {
                const created = await CallApi.createCall(selectedCall);
                _calls.push(created);
            }
            setCalls(_calls);
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: `Call ${selectedCall._id ? 'updated' : 'created'}`,
                life: 3000
            });
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to save call',
                detail: '' + err,
                life: 3000
            });
        } finally {
            setShowSaveDialog(false);
            setSelectedCall(emptyCall);
        }
    };

    const deleteCall = async () => {
        try {
            const deleted = await CallApi.deleteCall(selectedCall);
            if (deleted) {
                setCalls(calls.filter((c) => c._id !== selectedCall._id));
                toast.current?.show({
                    severity: 'success',
                    summary: 'Deleted',
                    detail: 'Call deleted',
                    life: 3000
                });
            }
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to delete call',
                detail: '' + err,
                life: 3000
            });
        } finally {
            setShowDeleteDialog(false);
            setSelectedCall(emptyCall);
        }
    };

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
                    >
                        <Column selectionMode="single" headerStyle={{ width: '3em' }}></Column>
                        <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                        <Column field="title" header="Title" sortable />
                        <Column field="dead_line" header="Dead Line" body={(rowData) => new Date(rowData.dead_line!).toLocaleDateString()} />
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
                    </DataTable>

                    {selectedCall && (
                        <SaveDialog
                            visible={showSaveDialog}
                            call={selectedCall}
                            calendars={calendars}
                            onChange={setSelectedCall}
                            onSave={saveCall}
                            onHide={() => setShowSaveDialog(false)}
                        />
                    )}

                    {selectedCall && (
                        <DeleteDialog
                            showDeleteDialog={showDeleteDialog}
                            selectedDataInfo={String(selectedCall.title)}
                            onDelete={deleteCall}
                            onHide={() => setShowDeleteDialog(false)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default CallPage;
