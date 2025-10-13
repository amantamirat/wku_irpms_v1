'use client';
import ConfirmDialog from '@/components/ConfirmationDialog';
import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableExpandedRows, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toolbar } from 'primereact/toolbar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CompositionApi } from '../api/composition.api';
import { Composition, validateComposition } from '../models/composition.model';

import { Constraint } from '../../models/constraint.model';
import SaveDialog from './SaveDialog';

interface CompositionManagerProps {
    parent: Constraint;
}

const CompositionManager = (props: CompositionManagerProps) => {
    const { parent } = props;
    const emptyComposition: Composition = {
        parent: parent,
        value: 0
    };

    const [compositions, setCompositions] = useState<Composition[]>([]);
    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [selectedComposition, setSelectedComposition] = useState<Composition>(emptyComposition);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [expandedRows, setExpandedRows] = useState<any[] | DataTableExpandedRows>([]);

    const fetchCompositions = useCallback(async () => {
        try {
            const data = await CompositionApi.getCompositions({ parent: parent._id });
            setCompositions(data);
        } catch (err) {
            // Handle error
        }
    }, [parent]);

    useEffect(() => {
        fetchCompositions();
    }, [fetchCompositions]);

    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
    }, []);

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };

    const saveComposition = async () => {
        let _compositions = [...compositions];
        if (selectedComposition._id) {
            const updated = await CompositionApi.updateComposition(selectedComposition);
            const index = _compositions.findIndex((c) => c._id === selectedComposition._id);
            _compositions[index] = { ...updated };
        } else {
            const created = await CompositionApi.createComposition(selectedComposition);
            _compositions.push({ ...selectedComposition, _id: created._id });
        }
        setCompositions(_compositions);
    };

    const deleteComposition = async () => {
        const deleted = await CompositionApi.deleteComposition(selectedComposition);
        if (deleted) {
            setCompositions(compositions.filter((c) => c._id !== selectedComposition._id));
        }
    };

    const hideDialogs = () => {
        setSelectedComposition(emptyComposition);
        setShowSaveDialog(false);
        setShowDeleteDialog(false);
    };

    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button label="Add Composition" icon="pi pi-plus" severity="success" className="mr-2"
                onClick={() => {
                    setSelectedComposition(emptyComposition);
                    setShowSaveDialog(true);
                }}
            />
        </div>
    );

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Manage Compositions</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" value={globalFilter} onChange={onGlobalFilterChange} placeholder="Search..." className="w-full md:w-1/3" />
            </span>
        </div>
    );

    const actionBodyTemplate = (rowData: Composition) => (
        <>
            <Button icon="pi pi-pencil" rounded severity="success" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setSelectedComposition(rowData);
                    setShowSaveDialog(true);
                }} />
            <Button icon="pi pi-trash" rounded severity="warning" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setSelectedComposition(rowData);
                    setShowDeleteDialog(true);
                }} />
        </>
    );

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <Toolbar className="mb-4" start={startToolbarTemplate}></Toolbar>
                    <DataTable
                        ref={dt}
                        value={compositions}
                        selection={selectedComposition}
                        onSelectionChange={(e) => setSelectedComposition(e.value as Composition)}
                        dataKey="_id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} compositions"
                        globalFilter={globalFilter}
                        emptyMessage="No composition data found."
                        header={header}
                        scrollable
                        filters={filters}
                        expandedRows={expandedRows}
                        onRowToggle={(e) => setExpandedRows(e.data)}
                    >
                        <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                        <Column field="min" header="Min" sortable />
                        <Column field="max" header="Max" sortable />
                        <Column field="item" header="Item" sortable />
                        <Column field="value" header="Value" sortable />
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
                    </DataTable>
                    {selectedComposition && (
                        <SaveDialog
                            visible={showSaveDialog}
                            composition={selectedComposition}
                            setComposition={setSelectedComposition}
                            parent={parent}
                            onSave={saveComposition}
                            onHide={hideDialogs}
                        />
                    )}
                    {selectedComposition && (
                        <ConfirmDialog
                            showDialog={showDeleteDialog}
                            selectedDataInfo={String(selectedComposition.value)}
                            onConfirmAsync={deleteComposition}
                            onHide={hideDialogs}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default CompositionManager;
