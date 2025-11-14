'use client';

import ConfirmDialog from '@/components/ConfirmationDialog';
import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableExpandedRows, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import { PositionApi } from '../api/position.api';
import { Position, PositionType } from '../models/position.model';
import SavePositionDialog from './SavePositionDialog';
import ErrorComponent from '@/components/ErrorComponent';

interface PositionProps {
    posType: PositionType;
    parent?: Position;
}

const PositionManager = ({ posType, parent }: PositionProps) => {
    const emptyPosition: Position = {
        type: posType,
        name: '',
        parent: posType === PositionType.rank && parent ? parent : ''
    };

    const [positions, setPositions] = useState<Position[]>([]);
    const [error, setError] = useState<string | null>(null);
    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [selectedPosition, setSelectedPosition] = useState<Position>(emptyPosition);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [expandedRows, setExpandedRows] = useState<any[] | DataTableExpandedRows>([]);
    const toast = useRef<Toast>(null);

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };

    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
    }, []);

    useEffect(() => {
        const fetchPositions = async () => {
            try {
                const data = await PositionApi.getPositions(
                    {
                        type: posType,
                        parent: parent?._id,
                    }
                );
                setPositions(data);
            } catch (err) {
                setError(`Failed to load positions. ${err}`);
            }
        };
        fetchPositions();
    }, []);

    if (error) {
        return (
            <ErrorComponent errorMessage={error} />
        );
    }

    const onSaveComplete = (savedPosition: Position) => {
        let _positions = [...positions];
        const index = _positions.findIndex((p) => p._id === savedPosition._id);
        if (index !== -1) {
            _positions[index] = { ...savedPosition };
        } else {
            _positions.push({ ...savedPosition });
        }
        setPositions(_positions);
        hideDialogs();
    };

    const deletePosition = async () => {
        const deleted = await PositionApi.deletePosition(selectedPosition);
        if (deleted) {
            setPositions(positions.filter((p) => p._id !== selectedPosition._id));
        }
        hideDialogs();
    };

    const hideDialogs = () => {
        setShowDeleteDialog(false);
        setShowSaveDialog(false);
        setSelectedPosition(emptyPosition);
    };

    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button
                label={`New ${posType}`}
                icon="pi pi-plus"
                severity="success"
                className="mr-2"
                onClick={() => {
                    setSelectedPosition(emptyPosition);
                    setShowSaveDialog(true);
                }}
            />
        </div>
    );

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Manage {posType}s</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText
                    type="search"
                    value={globalFilter}
                    onChange={onGlobalFilterChange}
                    placeholder="Search..."
                    className="w-full md:w-1/3"
                />
            </span>
        </div>
    );

    const actionBodyTemplate = (rowData: Position) => (
        <>
            <Button
                icon="pi pi-pencil"
                rounded
                severity="success"
                className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }}
                onClick={() => {
                    setSelectedPosition(rowData);
                    setShowSaveDialog(true);
                }}
            />
            <Button
                icon="pi pi-trash"
                rounded
                severity="warning"
                className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }}
                onClick={() => {
                    setSelectedPosition(rowData);
                    setShowDeleteDialog(true);
                }}
            />
        </>
    );

    const categoryBodyTemplate = (rowData: Position) => {
        return (
            <span className={`category-badge category-${rowData.category?.toLowerCase()}`}>
                {rowData.category}
            </span>
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
                        value={positions}
                        selection={selectedPosition}
                        onSelectionChange={(e) => setSelectedPosition(e.value as Position)}
                        dataKey="_id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} positions"
                        globalFilter={globalFilter}
                        emptyMessage="No position data found."
                        header={header}
                        scrollable
                        filters={filters}
                        expandedRows={expandedRows}
                        onRowToggle={(e) => setExpandedRows(e.data)}
                        rowExpansionTemplate={(rowData) => {
                            let position = rowData as Position;
                            if (posType === PositionType.rank) {
                                return null;
                            }
                            return (
                                <PositionManager
                                    posType={PositionType.rank}
                                    parent={position}
                                />
                            );
                        }}
                    >
                        {posType === PositionType.position &&
                            <Column expander style={{ width: '3em' }} />
                        }
                        <Column selectionMode="single" headerStyle={{ width: '3em' }}></Column>
                        <Column
                            header="#"
                            body={(rowData, options) => options.rowIndex + 1}
                            style={{ width: '50px' }}
                        />
                        <Column field="name" header="Name" sortable />

                        {posType === PositionType.position &&
                            <Column
                                field="category"
                                header="Category"
                                body={categoryBodyTemplate}
                                style={{ width: '150px', textAlign: 'center' }}
                            />
                        }

                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
                    </DataTable>

                    {selectedPosition && (
                        <SavePositionDialog
                            visible={showSaveDialog}
                            position={selectedPosition}
                            onComplete={onSaveComplete}
                            onHide={hideDialogs}
                        />
                    )}

                    {selectedPosition && (
                        <ConfirmDialog
                            showDialog={showDeleteDialog}
                            item={String(selectedPosition.name)}
                            onConfirmAsync={deletePosition}
                            onHide={() => setShowDeleteDialog(false)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default PositionManager;
