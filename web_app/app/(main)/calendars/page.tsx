'use client';

import DeleteDialog from '@/components/DeleteDialog';
import SaveDialog from './dialogs/SaveDialog';

import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import { Calendar } from './models/calendar.model';
import { CalendarApi } from './api/calendar.api';

const CalendarPage = () => {
    const emptyCalendar: Calendar = {
        year: new Date().getFullYear(),
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
    const toast = useRef<Toast>(null);

    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
        loadCalendars();
    }, []);

    const loadCalendars = async () => {
        try {
            const data = await CalendarApi.getCalendars();
            setCalendars(data);
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to load calendar data',
                detail: '' + err,
                life: 3000
            });
        }
    };

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };

    const saveCalendar = async () => {
        try {
            let _calendars = [...calendars];
            if (selectedCalendar._id) {
                const updated = await CalendarApi.updateCalendar(selectedCalendar);
                const index = _calendars.findIndex((c) => c._id === selectedCalendar._id);
                _calendars[index] = updated;
            } else {
                const created = await CalendarApi.createCalendar(selectedCalendar);
                _calendars.push(created);
            }
            setCalendars(_calendars);
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: `Calendar ${selectedCalendar._id ? 'updated' : 'created'}`,
                life: 3000
            });
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to save calendar',
                detail: '' + err,
                life: 3000
            });
        } finally {
            setShowSaveDialog(false);
            setSelectedCalendar(emptyCalendar);
        }
    };

    const deleteCalendar = async () => {
        try {
            const deleted = await CalendarApi.deleteCalendar(selectedCalendar);
            if (deleted) {
                setCalendars(calendars.filter((c) => c._id !== selectedCalendar._id));
                toast.current?.show({
                    severity: 'success',
                    summary: 'Deleted',
                    detail: 'Calendar deleted',
                    life: 3000
                });
            }
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to delete calendar',
                detail: '' + err,
                life: 3000
            });
        } finally {
            setShowDeleteDialog(false);
            setSelectedCalendar(emptyCalendar);
        }
    };

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

   

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
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
                       <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
                    </DataTable>

                    {selectedCalendar && (
                        <SaveDialog
                            visible={showSaveDialog}
                            calendar={selectedCalendar}
                            onChange={setSelectedCalendar}
                            onSave={saveCalendar}
                            onHide={() => setShowSaveDialog(false)}
                        />
                    )}

                    {selectedCalendar && (
                        <DeleteDialog
                            showDeleteDialog={showDeleteDialog}
                            selectedDataInfo={String(selectedCalendar.year)}
                            onDelete={deleteCalendar}
                            onHide={() => setShowDeleteDialog(false)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default CalendarPage;
