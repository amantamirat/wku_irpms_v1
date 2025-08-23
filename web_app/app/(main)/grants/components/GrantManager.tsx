'use client';

import DeleteDialog from '@/components/DeleteDialog';


import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Grant } from '../models/grant.model';
import { GrantApi } from '../api/grant.api';
import SaveDialog from './SaveDialog';
import { Calendar } from '../../calendars/models/calendar.model';
import { CalendarApi } from '../../calendars/api/calendar.api';
import { EvaluationApi } from '../../evals/api/eval.api';
import { Evaluation } from '../../evals/models/eval.model';
import { Theme } from '../../themes/models/theme.model';
import { ThemeApi } from '../../themes/api/theme.api';
import { Organization } from '../../organizations/models/organization.model';


interface GrantManagerProps {
    directorate: Organization;
}


const GrantManager = (props: GrantManagerProps) => {

    const { directorate } = props
    const emptyGrant: Grant = {
        directorate: props.directorate,
        title: '',
        theme: '',
        evaluation: ''
    };

    const [grants, setGrants] = useState<Grant[]>([]);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [themes, setThemes] = useState<Theme[]>([]);
    const [error, setError] = useState<string | null>(null);
    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [selectedGrant, setSelectedGrant] = useState<Grant>(emptyGrant);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const toast = useRef<Toast>(null);

    const loadGrants = useCallback(async () => {
        try {
            const data = await GrantApi.getGrants({ directorate: props.directorate._id });
            setGrants(data);
        } catch (err) {
            setError(`Failed to load grant data ${err}`);
        } finally {

        }
    }, [directorate, error]);


    const loadThemes = useCallback(async () => {
        try {
            const data = await ThemeApi.getThemes({ directorate: directorate._id });
            setThemes(data);
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to load theme data',
                detail: '' + err,
                life: 3000
            });
        }

    }, [directorate]);


    const loadEvaluations = useCallback(async () => {
        try {
            const data = await EvaluationApi.getEvaluations({ directorate: directorate._id });
            setEvaluations(data);
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to load evaluation data',
                detail: '' + err,
                life: 3000
            });
        }

    }, [directorate]);

    useEffect(() => {
        loadGrants();
        loadThemes();
        loadEvaluations();
    }, [loadGrants, loadThemes, loadEvaluations]);

    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');

    }, []);


    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };


    if (error) {
        return (
            <div className="flex align-items-center justify-content-center py-6">
                <div className="text-center">
                    <i className="pi pi-exclamation-triangle text-4xl text-500 mb-3" />
                    <p className="text-500 mb-4">{error}</p>
                    <Button
                        label="Retry"
                        icon="pi pi-refresh"
                        onClick={() => window.location.reload()}
                    />
                </div>
            </div>
        );
    }

    const saveGrant = async () => {
        try {
            let _grants = [...grants];
            if (selectedGrant._id) {
                const updated = await GrantApi.updateGrant(selectedGrant);
                const index = _grants.findIndex((c) => c._id === selectedGrant._id);
                _grants[index] = { ...updated, theme: selectedGrant.theme, evaluation: selectedGrant.evaluation };
            } else {
                const created = await GrantApi.createGrant(selectedGrant);
                _grants.push({ ...selectedGrant, _id: created._id });
            }
            setGrants(_grants);
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: `Grant ${selectedGrant._id ? 'updated' : 'created'}`,
                life: 3000
            });
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to save grant',
                detail: '' + err,
                life: 3000
            });
        } finally {
            setShowSaveDialog(false);
            setSelectedGrant(emptyGrant);
        }
    };

    const deleteGrant = async () => {
        try {
            const deleted = await GrantApi.deleteGrant(selectedGrant);
            if (deleted) {
                setGrants(grants.filter((c) => c._id !== selectedGrant._id));
                toast.current?.show({
                    severity: 'success',
                    summary: 'Deleted',
                    detail: 'Grant deleted',
                    life: 3000
                });
            }
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to delete grant',
                detail: '' + err,
                life: 3000
            });
        } finally {
            setShowDeleteDialog(false);
            setSelectedGrant(emptyGrant);
        }
    };

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
                    >
                        <Column selectionMode="single" headerStyle={{ width: '3em' }}></Column>
                        <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                        <Column field="title" header="Title" sortable />
                        <Column field="theme.title" header="Theme" sortable />
                        <Column field="evaluation.title" header="Evaluation" sortable />
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
                    </DataTable>

                    {selectedGrant && (
                        <SaveDialog
                            visible={showSaveDialog}
                            grant={selectedGrant}
                            themes={themes}
                            evaluations={evaluations}
                            onChange={setSelectedGrant}
                            onSave={saveGrant}
                            onHide={() => setShowSaveDialog(false)}
                        />
                    )}

                    {selectedGrant && (
                        <DeleteDialog
                            showDeleteDialog={showDeleteDialog}
                            selectedDataInfo={String(selectedGrant.title)}
                            onDelete={deleteGrant}
                            onHide={() => setShowDeleteDialog(false)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default GrantManager;
