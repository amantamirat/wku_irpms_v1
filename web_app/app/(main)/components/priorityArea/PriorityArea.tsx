'use client';

import DeleteDialog from '@/components/DeleteDialog';
import { PriorityArea } from '@/models/priorityArea';
import { PriorityAreaService } from '@/services/PriorityAreaService';
import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableExpandedRows, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import SaveDialog from './dialog/SaveDialog';
import { Theme } from '@/models/theme';
import SubAreaComp from '../subArea/SubArea.component';

interface PriorityAreaCompProps {
    theme: Theme;
}

const PriorityAreaComp = (props: PriorityAreaCompProps) => {

    const { theme } = props;

    const emptyPriorityArea: PriorityArea = {
        theme: theme,
        title: '',
    };

    const [priorityAreas, setPriorityAreas] = useState<PriorityArea[]>([]);
    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [selectedPriorityArea, setSelectedPriorityArea] = useState<PriorityArea>(emptyPriorityArea);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const toast = useRef<Toast>(null);
    const [expandedRows, setExpandedRows] = useState<any[] | DataTableExpandedRows>([]);


    const loadPriorityAreas = async () => {
        try {
            if (!theme) return;
            const data = await PriorityAreaService.getPriorityAreasByTheme(theme);
            setPriorityAreas(data);
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to load priorityArea data',
                detail: '' + err,
                life: 3000
            });
        }
    };

    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
        loadPriorityAreas();
    }, []);


    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };

    const savePriorityArea = async () => {
        try {
            let _priorityAreas = [...priorityAreas];
            if (selectedPriorityArea._id) {
                const updated = await PriorityAreaService.updatePriorityArea(selectedPriorityArea);
                const index = _priorityAreas.findIndex((c) => c._id === selectedPriorityArea._id);
                _priorityAreas[index] = updated;
            } else {
                const created = await PriorityAreaService.createPriorityArea(selectedPriorityArea);
                _priorityAreas.push(created);
            }
            setPriorityAreas(_priorityAreas);
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: `PriorityArea ${selectedPriorityArea._id ? 'updated' : 'created'}`,
                life: 3000
            });
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to save priorityArea',
                detail: '' + err,
                life: 3000
            });
        } finally {
            setShowSaveDialog(false);
            setSelectedPriorityArea(emptyPriorityArea);
        }
    };

    const deletePriorityArea = async () => {
        try {
            const deleted = await PriorityAreaService.deletePriorityArea(selectedPriorityArea);
            if (deleted) {
                setPriorityAreas(priorityAreas.filter((c) => c._id !== selectedPriorityArea._id));
                toast.current?.show({
                    severity: 'success',
                    summary: 'Deleted',
                    detail: 'PriorityArea deleted',
                    life: 3000
                });
            }
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to delete priorityArea',
                detail: '' + err,
                life: 3000
            });
        } finally {
            setShowDeleteDialog(false);
            setSelectedPriorityArea(emptyPriorityArea);
        }
    };

    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button label="New Priority Area" icon="pi pi-plus" severity="secondary" className="mr-2"
                onClick={() => {
                    setSelectedPriorityArea(emptyPriorityArea);
                    setShowSaveDialog(true);
                }}
            />
        </div>
    );

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Manage {theme.title} Priority Areas</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" value={globalFilter} onChange={onGlobalFilterChange} placeholder="Search..." className="w-full md:w-1/3" />
            </span>
        </div>
    );

    const actionBodyTemplate = (rowData: PriorityArea) => (
        <>
            <Button icon="pi pi-pencil" rounded severity="success" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setSelectedPriorityArea(rowData);
                    setShowSaveDialog(true);
                }} />
            <Button icon="pi pi-trash" rounded severity="warning" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setSelectedPriorityArea(rowData);
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
                        value={priorityAreas}
                        selection={selectedPriorityArea}
                        onSelectionChange={(e) => setSelectedPriorityArea(e.value as PriorityArea)}
                        dataKey="_id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} priorityAreas"
                        globalFilter={globalFilter}
                        emptyMessage={`No ${theme.title} priorityAreas data found.`}
                        header={header}
                        scrollable
                        filters={filters}
                        expandedRows={expandedRows}
                        onRowToggle={(e) => setExpandedRows(e.data)}
                        rowExpansionTemplate={(data) => (
                            <SubAreaComp
                                priorityArea={data as PriorityArea}
                            />
                        )}
                    >
                        <Column expander style={{ width: '3em' }} />
                        <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                        <Column field="title" header="Title" sortable />
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }} />
                    </DataTable>

                    {selectedPriorityArea && (
                        <SaveDialog
                            visible={showSaveDialog}
                            priorityArea={selectedPriorityArea}
                            onChange={setSelectedPriorityArea}
                            onSave={savePriorityArea}
                            onHide={() => setShowSaveDialog(false)}
                        />
                    )}

                    {selectedPriorityArea && (
                        <DeleteDialog
                            showDeleteDialog={showDeleteDialog}
                            selectedDataInfo={String(selectedPriorityArea.title)}
                            onDelete={deletePriorityArea}
                            onHide={() => setShowDeleteDialog(false)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default PriorityAreaComp;
