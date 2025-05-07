'use client';
import DeleteDialog from '@/components/DeleteDialog';
import { Directorate } from '@/models/directorate';
import { DirectorateService } from '@/services/DirectorateService';
import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import SaveDialog from './dialogs/SaveDialog';






const DirectoratePage = () => {
    let emptyDirectorate: Directorate = {
        directorate_name: ''
    };
    const [directorates, setDirectorates] = useState<Directorate[]>([]);
    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});

    const [selectedDirectorate, setSelectedDirectorate] = useState<Directorate>(emptyDirectorate);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const toast = useRef<Toast>(null);


    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
        loadDirectorates();
    }, []);

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };

    const loadDirectorates = async () => {
        try {
            const data = await DirectorateService.getDirectorates();
            setDirectorates(data);
        } catch (err) {
            console.error('Failed to load directorates:', err);
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to load directorates data',
                detail: '' + err,
                life: 3000
            });
        }
    };



    const saveDirectorate = async () => {
        try {
            let _directorates = [...(directorates as any)];
            if (selectedDirectorate._id) {
                const updatedDirectorate = await DirectorateService.updateDirectorate(selectedDirectorate);
                const index = directorates.findIndex((directorate) => directorate._id === selectedDirectorate._id);
                _directorates[index] = updatedDirectorate;
            } else {
                const newDirectorate = await DirectorateService.createDirectorate(selectedDirectorate);
                _directorates.push(newDirectorate);
            }
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: `Directorate ${selectedDirectorate._id ? "updated" : 'created'}`,
                life: 3000
            });
            setDirectorates(_directorates);
        } catch (error) {
            console.error(error);
            toast.current?.show({
                severity: 'error',
                summary: `Failed to ${selectedDirectorate._id ? "update" : 'create'} directorate`,
                detail: '' + error,
                life: 3000
            });
        } finally {
            setShowSaveDialog(false);
            setSelectedDirectorate(emptyDirectorate);
        }

    };


    const deleteDirectorate = async () => {
        try {
            const deleted = await DirectorateService.deleteDirectorate(selectedDirectorate);
            if (deleted) {
                let _directorates = (directorates as any)?.filter((val: any) => val._id !== selectedDirectorate._id);
                setDirectorates(_directorates);
                toast.current?.show({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Directorate Deleted',
                    life: 3000
                });
            }
        } catch (error) {
            console.error(error);
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to delete directorates',
                detail: '' + error,
                life: 3000
            });
        } finally {
            setShowDeleteDialog(false);
            setSelectedDirectorate(emptyDirectorate);
        }

    };

    const openSaveDialog = (directorate: Directorate) => {
        setSelectedDirectorate({ ...directorate });
        setShowSaveDialog(true);
    };


    const hideSaveDialog = () => {
        setShowSaveDialog(false);
        setSelectedDirectorate(emptyDirectorate);
    };

    const confirmDeleteItem = (directorate: Directorate) => {
        setSelectedDirectorate(directorate);
        setShowDeleteDialog(true);
    };

    const startToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="New Directorate" icon="pi pi-plus" severity="success" className="mr-2" onClick={() => openSaveDialog(emptyDirectorate)} />
                </div>
            </React.Fragment>
        );
    };



    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Manage Directorates</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" value={globalFilter} onChange={onGlobalFilterChange} placeholder="Search..." className="w-full md:w-1/3" />
            </span>
        </div>
    );

    const actionBodyTemplate = (rowData: Directorate) => {
        return (
            <>
                <Button icon="pi pi-pencil" rounded severity="success" className="p-button-rounded p-button-text"
                    style={{ fontSize: '2rem' }} onClick={() => openSaveDialog(rowData)} />
                <Button icon="pi pi-trash" rounded severity="warning" className="p-button-rounded p-button-text"
                    style={{ fontSize: '2rem' }} onClick={() => confirmDeleteItem(rowData)} />
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
                        value={directorates}
                        selection={selectedDirectorate}
                        onSelectionChange={(e) => setSelectedDirectorate(e.value as Directorate)}
                        dataKey="_id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} directorates"
                        globalFilter={globalFilter}
                        emptyMessage="No directorate data found."
                        header={header}
                        scrollable
                        filters={filters}
                        onRowDoubleClick={(e) => {
                            const selected = e.data;
                            if (selected) {
                                setSelectedDirectorate(selected as Directorate);
                            }
                        }}
                    >
                        <Column selectionMode="single" headerStyle={{ width: '3em' }}></Column>
                        <Column
                            header="#"
                            body={(rowData, options) => options.rowIndex + 1}
                            style={{ width: '50px' }}
                        />
                        <Column field="directorate_name" header="Directorate Name" sortable headerStyle={{ minWidth: '15rem' }}></Column>
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
                    </DataTable>

                    <SaveDialog
                        visible={showSaveDialog}
                        directorate={selectedDirectorate}
                        onChange={setSelectedDirectorate}
                        onSave={saveDirectorate}
                        onHide={hideSaveDialog}
                    />

                    <DeleteDialog
                        showDeleteDialog={showDeleteDialog}
                        selectedDataInfo={selectedDirectorate.directorate_name}
                        onDelete={deleteDirectorate}
                        onHide={() => setShowDeleteDialog(false)}
                    />

                </div>
            </div>
        </div>
    );
};

export default DirectoratePage;
