'use client';
import ConfirmDialog from '@/components/ConfirmationDialog';
import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Grant } from '../../models/grant.model';
import { ConstraintApi } from '../api/constraint.api';
import { BaseConstraintType, Constraint } from '../models/constraint.model';
import SaveDialog from './SaveDialog';


interface ConstraintManagerProps {
    type: BaseConstraintType;
    grant: Grant;
}

const ConstraintManager = (props: ConstraintManagerProps) => {

    const { type, grant } = props
    const emptyConstraint: Constraint = {
        grant: grant,
        type: type
    };

    const [constraints, setConstraints] = useState<Constraint[]>([]);
    const [error, setError] = useState<string | null>(null);
    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [selectedConstraint, setSelectedConstraint] = useState<Constraint>(emptyConstraint);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const toast = useRef<Toast>(null);

    const fetchConstraints = useCallback(async () => {
        try {
            const data = await ConstraintApi.getConstraints({ grant: props.grant._id, type: type });
            setConstraints(data);
        } catch (err) {
            // setError(`Failed to load constraint data ${err}`);
        } finally {

        }
    }, [grant, type]);

    useEffect(() => {
        fetchConstraints();
    }, [fetchConstraints]);

    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');

    }, []);


    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };




    const saveConstraint = async () => {
        try {
            let _constraints = [...constraints];
            if (selectedConstraint._id) {
                const updated = await ConstraintApi.updateConstraint(selectedConstraint);
                const index = _constraints.findIndex((c) => c._id === selectedConstraint._id);
                _constraints[index] = { ...updated };
            } else {
                const created = await ConstraintApi.createConstraint(selectedConstraint);
                _constraints.push({ ...selectedConstraint, _id: created._id });
            }
            setConstraints(_constraints);
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: `Constraint ${selectedConstraint._id ? 'updated' : 'created'}`,
                life: 3000
            });
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to save constraint',
                detail: '' + err,
                life: 3000
            });
        } finally {
            setShowSaveDialog(false);
            setSelectedConstraint(emptyConstraint);
        }
    };

    const deleteConstraint = async () => {
        try {
            const deleted = await ConstraintApi.deleteConstraint(selectedConstraint);
            if (deleted) {
                setConstraints(constraints.filter((c) => c._id !== selectedConstraint._id));
                toast.current?.show({
                    severity: 'success',
                    summary: 'Deleted',
                    detail: 'Constraint deleted',
                    life: 3000
                });
            }
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to delete constraint',
                detail: '' + err,
                life: 3000
            });
        } finally {
            setShowDeleteDialog(false);
            setSelectedConstraint(emptyConstraint);
        }
    };

    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button label={`New ${type} Constraint`} icon="pi pi-plus" severity="success" className="mr-2"
                onClick={() => {
                    setSelectedConstraint(emptyConstraint);
                    setShowSaveDialog(true);
                }}
            />
        </div>
    );

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Manage {type} Constraints</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" value={globalFilter} onChange={onGlobalFilterChange} placeholder="Search..." className="w-full md:w-1/3" />
            </span>
        </div>
    );

    const actionBodyTemplate = (rowData: Constraint) => (
        <>
            <Button icon="pi pi-pencil" rounded severity="success" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setSelectedConstraint(rowData);
                    setShowSaveDialog(true);
                }} />
            <Button icon="pi pi-trash" rounded severity="warning" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setSelectedConstraint(rowData);
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
                        value={constraints}
                        selection={selectedConstraint}
                        onSelectionChange={(e) => setSelectedConstraint(e.value as Constraint)}
                        dataKey="_id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} constraints"
                        globalFilter={globalFilter}
                        emptyMessage="No constraint data found."
                        header={header}
                        scrollable
                        filters={filters}
                    >
                        <Column selectionMode="single" headerStyle={{ width: '3em' }}></Column>
                        <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                        {
                            //<Column field="type" header="Type" sortable />
                        }
                        <Column field="constraint" header="Constraint" sortable />
                        <Column field="min" header="Min" sortable />
                        <Column field="max" header="Max" sortable />
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
                    </DataTable>
                    {selectedConstraint && (
                        <SaveDialog
                            visible={showSaveDialog}
                            constraint={selectedConstraint}
                            setConstraint={setSelectedConstraint}
                            onSave={saveConstraint}
                            onHide={() => setShowSaveDialog(false)}
                        />
                    )}
                    {selectedConstraint && (
                        <ConfirmDialog
                            showDialog={showDeleteDialog}
                            selectedDataInfo={String(selectedConstraint.type)}
                            onConfirmAsync={deleteConstraint}
                            onHide={() => setShowDeleteDialog(false)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConstraintManager;
