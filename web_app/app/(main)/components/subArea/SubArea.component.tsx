'use client';

import DeleteDialog from '@/components/DeleteDialog';
import { SubArea } from '@/models/subArea';
import { SubAreaService } from '@/services/SubAreaService';
import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import { PriorityArea } from '@/models/priorityArea';
import SaveDialog from './dialog/SaveDialog';

interface SubAreaCompProps {
    priorityArea: PriorityArea;
}

const SubAreaComp = (props: SubAreaCompProps) => {

    const { priorityArea } = props;

    const emptySubArea: SubArea = {
        priorityArea: priorityArea,
        title: '',
    };

    const [subAreas, setSubAreas] = useState<SubArea[]>([]);
    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [selectedSubArea, setSelectedSubArea] = useState<SubArea>(emptySubArea);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const toast = useRef<Toast>(null);


    const loadSubAreas = async () => {
        try {
            if (!priorityArea) return;
            const data = await SubAreaService.getSubAreasByPriorityArea(priorityArea);
            setSubAreas(data);
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to load subArea data',
                detail: '' + err,
                life: 3000
            });
        }
    };

    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
        loadSubAreas();
    }, []);


    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };

    const saveSubArea = async () => {
        try {
            let _subAreas = [...subAreas];
            if (selectedSubArea._id) {
                const updated = await SubAreaService.updateSubArea(selectedSubArea);
                const index = _subAreas.findIndex((c) => c._id === selectedSubArea._id);
                _subAreas[index] = updated;
            } else {
                const created = await SubAreaService.createSubArea(selectedSubArea);
                _subAreas.push(created);
            }
            setSubAreas(_subAreas);
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: `SubArea ${selectedSubArea._id ? 'updated' : 'created'}`,
                life: 3000
            });
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to save subArea',
                detail: '' + err,
                life: 3000
            });
        } finally {
            setShowSaveDialog(false);
            setSelectedSubArea(emptySubArea);
        }
    };

    const deleteSubArea = async () => {
        try {
            const deleted = await SubAreaService.deleteSubArea(selectedSubArea);
            if (deleted) {
                setSubAreas(subAreas.filter((c) => c._id !== selectedSubArea._id));
                toast.current?.show({
                    severity: 'success',
                    summary: 'Deleted',
                    detail: 'SubArea deleted',
                    life: 3000
                });
            }
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to delete subArea',
                detail: '' + err,
                life: 3000
            });
        } finally {
            setShowDeleteDialog(false);
            setSelectedSubArea(emptySubArea);
        }
    };

    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button label="New SubArea" icon="pi pi-plus" severity="success" className="mr-2"
                onClick={() => {
                    setSelectedSubArea(emptySubArea);
                    setShowSaveDialog(true);
                }}
            />
        </div>
    );

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Manage {priorityArea.title} SubAreas</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" value={globalFilter} onChange={onGlobalFilterChange} placeholder="Search..." className="w-full md:w-1/3" />
            </span>
        </div>
    );

    const actionBodyTemplate = (rowData: SubArea) => (
        <>
            <Button icon="pi pi-pencil" rounded severity="success" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setSelectedSubArea(rowData);
                    setShowSaveDialog(true);
                }} />
            <Button icon="pi pi-trash" rounded severity="warning" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setSelectedSubArea(rowData);
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
                        value={subAreas}
                        selection={selectedSubArea}
                        onSelectionChange={(e) => setSelectedSubArea(e.value as SubArea)}
                        dataKey="_id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} subAreas"
                        globalFilter={globalFilter}
                        emptyMessage={`No ${priorityArea.title} subAreas data found.`}
                        header={header}
                        scrollable
                        filters={filters}
                    >
                        <Column selectionMode="single" headerStyle={{ width: '3em' }}></Column>
                        <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                        <Column field="title" header="Title" sortable />
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
                    </DataTable>

                    {selectedSubArea && (
                        <SaveDialog
                            visible={showSaveDialog}
                            subArea={selectedSubArea}
                            onChange={setSelectedSubArea}
                            onSave={saveSubArea}
                            onHide={() => setShowSaveDialog(false)}
                        />
                    )}

                    {selectedSubArea && (
                        <DeleteDialog
                            showDeleteDialog={showDeleteDialog}
                            selectedDataInfo={String(selectedSubArea.title)}
                            onDelete={deleteSubArea}
                            onHide={() => setShowDeleteDialog(false)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubAreaComp;
