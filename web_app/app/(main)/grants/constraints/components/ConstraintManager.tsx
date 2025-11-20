'use client';
import ConfirmDialog from '@/components/ConfirmationDialog';
import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableExpandedRows, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toolbar } from 'primereact/toolbar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Grant } from '../../models/grant.model';
import { ConstraintApi } from '../api/constraint.api';
import CompositionManager from '../compositions/components/CompositionManager';
import { ConstraintType, Constraint } from '../models/constraint.model';
import SaveDialog from './SaveDialog';
import ErrorCard from '@/components/ErrorCard';


interface ConstraintManagerProps {
    type: ConstraintType;
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
    const [expandedRows, setExpandedRows] = useState<any[] | DataTableExpandedRows>([]);

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };
    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');

    }, []);

    const fetchConstraints = useCallback(async () => {
        try {
            const data = await ConstraintApi.getConstraints({ grant: grant._id, type: type });
            setConstraints(data);
        } catch (err) {
            setError(`Failed to fetch constraint data ${err}`);
        }
    }, [grant, type, parent]);

    useEffect(() => {
        fetchConstraints();
    }, [fetchConstraints]);

    if (error) {
        return (
            <ErrorCard errorMessage={error} />
        );
    }


    const onSaveComplete = (savedConstraint: Constraint) => {
        let _constraints = [...constraints]; // constraints is your local state array of Constraint
        const index = _constraints.findIndex((c) => c._id === savedConstraint._id);
        if (index !== -1) {
            // Update existing constraint
            _constraints[index] = { ...savedConstraint };
        } else {
            // Add new constraint
            _constraints.push({ ...savedConstraint });
        }
        setConstraints(_constraints);
        hideDialogs();
    };


    const deleteConstraint = async () => {
        const deleted = await ConstraintApi.deleteConstraint(selectedConstraint);
        if (deleted) {
            setConstraints(constraints.filter((c) => c._id !== selectedConstraint._id));
            //setShowDeleteDialog(false);
            //setSelectedConstraint(emptyConstraint);
        }
    };

    const hideDialogs = () => {
        setSelectedConstraint(emptyConstraint);
        setShowSaveDialog(false);
        setShowDeleteDialog(false);
    }

    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button label={`${type} Constraint`} icon="pi pi-plus" severity="success" className="mr-2"
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
        <div className="card">
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
                expandedRows={expandedRows}
                onRowToggle={(e) => setExpandedRows(e.data)}
                rowExpansionTemplate={(rowData) => {
                    if (type === ConstraintType.APPLICANT) {
                        return (
                            <CompositionManager constraint={rowData as Constraint} />
                        )
                    }
                }}
            >
                {
                    type === ConstraintType.APPLICANT &&
                    <Column expander style={{ width: '3em' }} />
                }
                {
                    type !== ConstraintType.APPLICANT &&
                    <Column selectionMode="single" style={{ width: '3em' }} />

                }
                <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                <Column field="constraint" header="Constraint" sortable />
                {
                    type === ConstraintType.APPLICANT &&
                    (<Column field="mode" header="Mode" sortable />)
                }
                {
                    (type === ConstraintType.PROJECT
                    ) &&
                    (<Column field="min" header="Min" sortable />)
                }
                {
                    (type === ConstraintType.PROJECT) &&
                    (<Column field="max" header="Max" sortable />)
                }
                <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
            </DataTable>
            {selectedConstraint && (
                <SaveDialog
                    visible={showSaveDialog}
                    constraint={selectedConstraint}
                    onComplete={onSaveComplete}
                    onHide={hideDialogs}
                />
            )}
            {selectedConstraint && (
                <ConfirmDialog
                    showDialog={showDeleteDialog}
                    item={String(selectedConstraint.type)}
                    onConfirmAsync={deleteConstraint}
                    onHide={hideDialogs}
                />
            )}
        </div>
    );
};

export default ConstraintManager;
