'use client';

import ConfirmDialog from '@/components/ConfirmationDialog';


import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableExpandedRows, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GrantApi } from '../api/grant.api';
import ConstraintContainer from '../constraints/components/ConstraintContainer';
import { Grant } from '../models/grant.model';
import SaveDialog from './SaveDialog';
import ErrorComponent from '@/components/ErrorComponent';



const GrantManager = () => {

    const emptyGrant: Grant = {
        directorate: '',
        title: ''
    };

    const [grants, setGrants] = useState<Grant[]>([]);
    const [error, setError] = useState<string | null>(null);
    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [selectedGrant, setSelectedGrant] = useState<Grant>(emptyGrant);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [expandedRows, setExpandedRows] = useState<any[] | DataTableExpandedRows>([]);
    const toast = useRef<Toast>(null);

    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
    }, []);


    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };


    const fetchGrants = useCallback(async () => {
        try {
            const data = await GrantApi.getUserGrants();
            setGrants(data);
        } catch (err) {
            setError(`Failed to load grant data ${err}`);
        }
    }, []);

    useEffect(() => {
        fetchGrants();
    }, [fetchGrants]);


    if (error) {
        return (
            <ErrorComponent errorMessage={error} />
        );
    }

    const onSaveComplete = (savedgrant: Grant) => {
        let _grants = [...grants]; // grants is your local state array of grant
        const index = _grants.findIndex((a) => a._id === savedgrant._id);
        if (index !== -1) {
            _grants[index] = { ...savedgrant };
        } else {
            _grants.push({ ...savedgrant });
        }
        setGrants(_grants);
        hideDialogs();
    };

    const deleteGrant = async () => {
        const deleted = await GrantApi.deleteGrant(selectedGrant);
        if (deleted) {
            setGrants(grants.filter((c) => c._id !== selectedGrant._id));
            hideDialogs();
        }
    };
    const hideDialogs = () => {
        setShowSaveDialog(false);
        setShowDeleteDialog(false);
        setSelectedGrant(emptyGrant);
    }

    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button label="New Grant" icon="pi pi-plus" severity="success" className="mr-2"
                onClick={() => {
                    setSelectedGrant(emptyGrant);
                    setShowSaveDialog(true);
                }}
            />
        </div>
    );

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Manage Grants</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" value={globalFilter} onChange={onGlobalFilterChange} placeholder="Search..." className="w-full md:w-1/3" />
            </span>
        </div>
    );

    const actionBodyTemplate = (rowData: Grant) => (
        <>
            <Button icon="pi pi-pencil" rounded severity="success" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setSelectedGrant(rowData);
                    setShowSaveDialog(true);
                }} />
            <Button icon="pi pi-trash" rounded severity="warning" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setSelectedGrant(rowData);
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
                        value={grants}
                        selection={selectedGrant}
                        onSelectionChange={(e) => setSelectedGrant(e.value as Grant)}
                        dataKey="_id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} grants"
                        globalFilter={globalFilter}
                        emptyMessage="No grant data found."
                        header={header}
                        scrollable
                        filters={filters}
                        expandedRows={expandedRows}
                        onRowToggle={(e) => setExpandedRows(e.data)}
                        rowExpansionTemplate={(rowData) => {
                            return (<ConstraintContainer grant={rowData as Grant} />)
                        }}
                    >

                        <Column expander style={{ width: '3em' }} />
                        <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                        <Column field="directorate.name" header="Directorate" sortable />
                        <Column field="title" header="Title" sortable />
                        <Column field="description" header="Description" sortable />
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
                    </DataTable>

                    {selectedGrant && (
                        <SaveDialog
                            visible={showSaveDialog}
                            grant={selectedGrant}
                            onComplete={onSaveComplete}
                            onHide={() => setShowSaveDialog(false)}
                        />
                    )}

                    {selectedGrant && (
                        <ConfirmDialog
                            showDialog={showDeleteDialog}
                            selectedDataInfo={String(selectedGrant.title)}
                            onConfirmAsync={deleteGrant}
                            onHide={() => setShowDeleteDialog(false)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default GrantManager;
