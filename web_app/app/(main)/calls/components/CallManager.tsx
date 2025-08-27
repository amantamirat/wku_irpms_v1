'use client';

import DeleteDialog from '@/components/DeleteDialog';
import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Call, CallStatus } from '../models/call.model';
import { CallApi } from '../api/call.api';
import SaveDialog from './SaveDialog';
import { Calendar } from '../../calendars/models/calendar.model';
import { CalendarApi } from '../../calendars/api/calendar.api';
import { GrantApi } from '../../grants/api/grant.api';
import { Grant } from '../../grants/models/grant.model';


interface CallManagerProps {
    directorate: any;
}


const CallManager = (props: CallManagerProps) => {

    const emptyCall: Call = {
        calendar: '',
        directorate: props.directorate,
        title: '',
        deadline: new Date(),
        grant:'',
        status: CallStatus.planned,
    };

    const [calls, setCalls] = useState<Call[]>([]);
    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const [grants, setGrants] = useState<Grant[]>([]);
    const [error, setError] = useState<string | null>(null);
    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [selectedCall, setSelectedCall] = useState<Call>(emptyCall);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const toast = useRef<Toast>(null);

    const loadCalls = useCallback(async () => {
        try {
            const data = await CallApi.getCalls({ directorate: props.directorate._id });
            setCalls(data);
        } catch (err) {
            setError(`Failed to load grant data ${err}`);
        } finally {

        }
    }, [props.directorate, error]);

    const loadGrants = useCallback(async () => {
        try {
            const data = await GrantApi.getGrants({ directorate: props.directorate._id });
            setGrants(data);
        } catch (err) {
            setError(`Failed to load grant data ${err}`);
        } finally {

        }
    }, [props.directorate, error]);

    const loadCalendars = async () => {
        try {
            const data = await CalendarApi.getCalendars();
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

    useEffect(() => {
        loadCalls();
        loadGrants();
    }, [loadCalls, loadGrants]);

    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
        loadCalendars();
    }, []);


    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };

     if (error) {
            return (
                <div className="flex align-items-center justify-content-center py-6">
                    <div className="text-center">
                        <i className="pi pi-exclamation-triangle text-4xl text-500 mb-3" />
                        <p className="text-500 mb-4">{error}</p>
                        <Button
                            label="Retry"
                            icon="pi pi-refresh"
                            onClick={() => window.location.reload()}
                        />
                    </div>
                </div>
            );
        }

    const saveCall = async () => {
        try {
            let _calls = [...calls];
            if (selectedCall._id) {
                const updated = await CallApi.updateCall(selectedCall);
                const index = _calls.findIndex((c) => c._id === selectedCall._id);
                _calls[index] = { ...updated, calendar: selectedCall.calendar, grant:selectedCall.grant };
            } else {
                const created = await CallApi.createCall(selectedCall);
                _calls.push({ ...selectedCall, _id: created._id });
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
            <h5 className="m-0">Manage  {props.directorate.name} Calls</h5>
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
                        <Column field="calendar.year" header="Calendar" sortable />                        
                        <Column field="deadline" header="Deadline" body={(rowData) => new Date(rowData.deadline!).toLocaleDateString('en-CA')} />
                        <Column field="grant.title" header="Grant" sortable />
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
                    </DataTable>

                    {selectedCall && (
                        <SaveDialog
                            visible={showSaveDialog}
                            call={selectedCall}
                            calendars={calendars}
                            grants={grants}
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

export default CallManager;
