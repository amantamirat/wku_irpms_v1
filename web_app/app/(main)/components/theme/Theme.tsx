'use client';

import DeleteDialog from '@/components/DeleteDialog';
import { Theme, ThemeType } from '@/models/theme/theme';
import { ThemeService } from '@/services/theme/ThemeService';
import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableExpandedRows, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import SaveDialog from './dialogs/SaveDialog';
import { Organization } from '@/models/organization';


interface ThemeCompProps {
    type: ThemeType;
    directorate?: Organization;
    parent?: Theme;
}

const ThemeComponent = (props: ThemeCompProps) => {

    const type = props.type;
    const childType = type === ThemeType.theme ? ThemeType.priorityArea : type === ThemeType.priorityArea ? ThemeType.subArea : null;


    const emptyTheme: Theme = {
        title: '',
        type: props.type,
        directorate: props.directorate,
        parent: props.parent
    };

    const [themes, setThemes] = useState<Theme[]>([]);
    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [selectedTheme, setSelectedTheme] = useState<Theme>(emptyTheme);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const toast = useRef<Toast>(null);
    const [expandedRows, setExpandedRows] = useState<any[] | DataTableExpandedRows>([]);



    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };


    const loadThemes = useCallback(async () => {
        try {
            if (props.directorate && props.type === ThemeType.theme) {
                const data = await ThemeService.getThemesByDirectorate(props.directorate._id || '');
                setThemes(data);
            } else if (props.parent) {
                const data = await ThemeService.getThemesByParent(props.parent._id || '');
                setThemes(data);
            }
        } catch (err) {
            console.error('Failed to load themes:', err);
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to load themes data',
                detail: '' + err,
                life: 3000
            });
        }
    }, [props.parent, props.directorate, toast]);

    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
        loadThemes();
    }, [loadThemes]);

    const saveTheme = async () => {
        try {
            let _themes = [...themes];
            if (selectedTheme._id) {
                const updated = await ThemeService.updateTheme(selectedTheme);
                const index = _themes.findIndex((c) => c._id === selectedTheme._id);
                _themes[index] = updated;
            } else {
                const created = await ThemeService.createTheme(selectedTheme);
                _themes.push({ ...selectedTheme, _id: created._id });
            }
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: `Theme ${selectedTheme._id ? 'updated' : 'created'}`,
                life: 3000
            });
            setThemes(_themes);
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to save theme',
                detail: '' + err,
                life: 3000
            });
        } finally {
            setShowSaveDialog(false);
            setSelectedTheme(emptyTheme);
        }
    };

    const deleteTheme = async () => {
        try {
            const deleted = await ThemeService.deleteTheme(selectedTheme);
            if (deleted) {
                setThemes(themes.filter((c) => c._id !== selectedTheme._id));
                toast.current?.show({
                    severity: 'success',
                    summary: 'Deleted',
                    detail: 'Theme deleted',
                    life: 3000
                });
            }
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to delete theme',
                detail: '' + err,
                life: 3000
            });
        } finally {
            setShowDeleteDialog(false);
            setSelectedTheme(emptyTheme);
        }
    };

    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button label={`New ${type}`} icon="pi pi-plus" severity="success" className="mr-2"
                onClick={() => {
                    setSelectedTheme(emptyTheme);
                    setShowSaveDialog(true);
                }}
            />
        </div>
    );

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Manage {props.directorate?.name} {props.parent?.title} {type}s</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" value={globalFilter} onChange={onGlobalFilterChange} placeholder="Search..." className="w-full md:w-1/3" />
            </span>
        </div>
    );

    const actionBodyTemplate = (rowData: Theme) => (
        <>
            <Button icon="pi pi-pencil" rounded severity="success" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setSelectedTheme(rowData);
                    setShowSaveDialog(true);
                }} />
            <Button icon="pi pi-trash" rounded severity="warning" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setSelectedTheme(rowData);
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
                        value={themes}
                        selection={selectedTheme}
                        onSelectionChange={(e) => setSelectedTheme(e.value as Theme)}
                        dataKey="_id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"                        
                        currentPageReportTemplate={`Showing {first} to {last} of {totalRecords} ${type}s`}
                        globalFilter={globalFilter}
                        emptyMessage={`No themes data found.`}
                        header={header}
                        scrollable
                        filters={filters}
                        {...(childType && {
                            expandedRows: expandedRows,
                            onRowToggle: (e) => setExpandedRows(e.data),
                            rowExpansionTemplate: (data) => (
                                <ThemeComponent
                                    type={childType}
                                    parent={data as Theme}
                                />
                            )
                        })}
                    >
                        {
                            childType
                                ? <Column expander style={{ width: '3em' }} />
                                : <Column selectionMode="single" headerStyle={{ width: '3em' }} />
                        }
                        <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                        <Column field="title" header="Title" sortable />
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
                    </DataTable>

                    {selectedTheme && (
                        <SaveDialog
                            visible={showSaveDialog}
                            theme={selectedTheme}
                            onChange={setSelectedTheme}
                            onSave={saveTheme}
                            onHide={() => setShowSaveDialog(false)}
                        />
                    )}

                    {selectedTheme && (
                        <DeleteDialog
                            showDeleteDialog={showDeleteDialog}
                            selectedDataInfo={String(selectedTheme.title)}
                            onDelete={deleteTheme}
                            onHide={() => setShowDeleteDialog(false)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ThemeComponent;
