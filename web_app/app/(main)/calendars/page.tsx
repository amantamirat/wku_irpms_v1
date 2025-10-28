'use client';

import ConfirmDialog from '@/components/ConfirmationDialog';
import ErrorComponent from '@/components/ErrorComponent';
import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import { CalendarApi } from './api/calendar.api';
import SaveCalendarDialog from './dialogs/SaveCalendarDialog';
import { Calendar, CalendarStatus } from './models/calendar.model';

const CalendarPage = () => {
    const emptyCalendar: Calendar = {
        year: new Date().getFullYear(),
        status: CalendarStatus.active,
        start_date: new Date(),
        end_date: new Date(),
    };

    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [selectedCalendar, setSelectedCalendar] = useState<Calendar>(emptyCalendar);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };

    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');

    }, []);

    useEffect(() => {
        const fetchCalendars = async () => {
            try {
                const data = await CalendarApi.getCalendars({});
                setCalendars(data);
            } catch (err) {
                setError("Failed to fetch calendars:" + err);
            }
        };
        fetchCalendars();
    }, []);

    if (error) {
        return (
            <ErrorComponent errorMessage={error} />
        );
    }

    const onSaveComplete = (savedCalendar: Calendar) => {
        let _calendars = [...calendars]; // clone the current state array
        const index = _calendars.findIndex((c) => c._id === savedCalendar._id);
        if (index !== -1) {
            _calendars[index] = { ...savedCalendar };
        } else {
            _calendars.push({ ...savedCalendar });
        }
        setCalendars(_calendars); // update the React state
        hideDialogs();             // close dialog
    };


    const deleteCalendar = async () => {
        const deleted = await CalendarApi.deleteCalendar(selectedCalendar);
        if (deleted) {
            setCalendars(calendars.filter((c) => c._id !== selectedCalendar._id));
            hideDialogs();
        }
    };

    const hideDialogs = () => {
        setShowSaveDialog(false);
        setShowDeleteDialog(false);
    }
    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button label="New Calendar" icon="pi pi-plus" severity="success" className="mr-2"
                onClick={() => {
                    setSelectedCalendar(emptyCalendar);
                    setShowSaveDialog(true);
                }}
            />
        </div>
    );

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Manage Calendars</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" value={globalFilter} onChange={onGlobalFilterChange} placeholder="Search..." className="w-full md:w-1/3" />
            </span>
        </div>
    );

    const actionBodyTemplate = (rowData: Calendar) => (
        <>
            <Button icon="pi pi-pencil" rounded severity="success" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setSelectedCalendar(rowData);
                    setShowSaveDialog(true);
                }} />
            <Button icon="pi pi-trash" rounded severity="warning" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setSelectedCalendar(rowData);
                    setShowDeleteDialog(true);
                }} />
        </>
    );

    const statusBodyTemplate = (rowData: Calendar) => {
        return (
            <span className={`status-badge status-${rowData.status}`}>{rowData.status}</span>
        );
    };


    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">                  
                    <Toolbar className="mb-4" start={startToolbarTemplate}></Toolbar>
                    <DataTable
                        ref={dt}
                        value={calendars}
                        selection={selectedCalendar}
                        onSelectionChange={(e) => setSelectedCalendar(e.value as Calendar)}
                        dataKey="_id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} calendars"
                        globalFilter={globalFilter}
                        emptyMessage="No calendar data found."
                        header={header}
                        scrollable
                        filters={filters}
                    >
                        <Column selectionMode="single" headerStyle={{ width: '3em' }}></Column>
                        <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                        <Column field="year" header="Year" sortable />
                        <Column field="start_date" header="Start Date" body={(rowData) => new Date(rowData.start_date!).toLocaleDateString('en-CA')} />
                        <Column field="end_date" header="End Date" body={(rowData) => new Date(rowData.end_date!).toLocaleDateString('en-CA')} />
                        <Column header="Status" body={statusBodyTemplate} sortable />
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
                    </DataTable>

                    {selectedCalendar && (
                        <SaveCalendarDialog
                            visible={showSaveDialog}
                            calendar={selectedCalendar}
                            onComplete={onSaveComplete}
                            onHide={hideDialogs}
                        />
                    )}

                    {selectedCalendar && (
                        <ConfirmDialog
                            showDialog={showDeleteDialog}
                            selectedDataInfo={String(selectedCalendar.year)}
                            onConfirmAsync={deleteCalendar}
                            onHide={hideDialogs}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default CalendarPage;
