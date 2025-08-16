'use client';

import DeleteDialog from '@/components/DeleteDialog';
import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableExpandedRows, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Organization } from '@/models/organization';
import SaveDialog from './dialogs/SaveDialog';
import { Theme, ThemeLevel, ThemeType } from '../models/theme.model';
import { ThemeApi } from '../api/theme.api';


interface ThemeManagerProps {
    type: ThemeType;
    directorate?: Organization;
    parent?: Theme;
    themeLevel?: ThemeLevel;
}

const ThemeManager = (props: ThemeManagerProps) => {

    const type = props.type;
    let level = props.themeLevel;
    const isBroadLevel = level === ThemeLevel.broad;
    const isComponenetLevel = level === ThemeLevel.componenet;
    //const isNarrowLevel = level === ThemeLevel.narrow;
    const isCatalog = type === ThemeType.catalog;
    const isBroadTheme = type === ThemeType.broadTheme;
    const isSubTheme = type === ThemeType.componenet;
    //const isFocusArea = type === ThemeType.focusArea;
    const childType = isCatalog ? ThemeType.broadTheme : isBroadTheme ? ThemeType.componenet : isSubTheme ? ThemeType.focusArea : null;
    const isSelectionOnly = !childType || (isBroadLevel && isBroadTheme) || (isComponenetLevel && isSubTheme); // Non Expandable 

    const emptyTheme: Theme = {
        title: '',
        type: type,
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
    const [loading, setLoading] = useState(false);


    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };


    const loadThemes = useCallback(async () => {
        try {
            setLoading(true);
            if (props.directorate && isCatalog) {
                const data = await ThemeApi.getThemes({
                    type: props.type,
                    directorate: props.directorate._id || ''
                });
                setThemes(data);
            } else if (props.parent) {
                const data = await ThemeApi.getThemes({
                    type: props.type,
                    parent: props.parent._id || ''
                });
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
        } finally {
            setLoading(false);
        }
    }, [props.parent, props.directorate, toast]);

    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
        loadThemes();
    }, [loadThemes]);

    const saveTheme = async () => {
        try {
            setLoading(true);
            let _themes = [...themes];
            if (selectedTheme._id) {
                const updated = await ThemeApi.updateTheme(selectedTheme);
                const index = _themes.findIndex((c) => c._id === selectedTheme._id);
                _themes[index] = updated;
            } else {
                const created = await ThemeApi.createTheme(selectedTheme);
                _themes.push({ ...selectedTheme, _id: created._id });
            }
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: `${type} ${selectedTheme._id ? 'updated' : 'created'}`,
                life: 3000
            });
            setThemes(_themes);
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: `Failed to save ${type}`,
                detail: '' + err,
                life: 3000
            });
        } finally {
            setShowSaveDialog(false);
            setSelectedTheme(emptyTheme);
            setLoading(false);
        }
    };

    const deleteTheme = async () => {
        try {
            setLoading(true);
            const deleted = await ThemeApi.deleteTheme(selectedTheme);
            if (deleted) {
                setThemes(themes.filter((c) => c._id !== selectedTheme._id));
                toast.current?.show({
                    severity: 'success',
                    summary: 'Deleted',
                    detail: `${type} deleted`,
                    life: 3000
                });
            }
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: `Failed to delete ${type}`,
                detail: '' + err,
                life: 3000
            });
        } finally {
            setShowDeleteDialog(false);
            setSelectedTheme(emptyTheme);
            setLoading(false);
        }
    };

    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button label={`New ${type}`} icon="pi pi-plus" severity='success'
                className={`mr-2 theme-type-button ${type.split('-')[0].toLowerCase()}`}
                onClick={() => {
                    setSelectedTheme(emptyTheme);
                    setShowSaveDialog(true);
                }}
            />
        </div>
    );

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Manage {type}s of {props.directorate?.name} {props.parent?.title} </h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" value={globalFilter} onChange={onGlobalFilterChange} placeholder="Search..." className="w-full md:w-1/3" />
            </span>
        </div>
    );

    const themeLevelBodyTemplate = (rowData: Theme) => {
        return (
            <span className={`theme-level-badge theme-${rowData.level}`}>
                {rowData.level}
            </span>
        );
    };

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
                        loading={loading}
                        expandedRows={expandedRows}
                        onRowToggle={(e) => setExpandedRows(e.data)}
                        rowExpansionTemplate={(rowData) => {
                            let rowTheme = rowData as Theme;
                            if (isCatalog && rowTheme.level) {
                                level = rowTheme.level
                            } else if (isSelectionOnly) {
                                return null;
                            }
                            return (
                                <ThemeManager
                                    type={childType ? childType : ThemeType.catalog}
                                    parent={rowTheme}
                                    themeLevel={level}
                                />
                            );
                        }}

                    >
                        {
                            isSelectionOnly ? <Column selectionMode="single" style={{ width: '3em' }} /> :
                                <Column expander style={{ width: '3em' }} />
                        }
                        <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                        <Column field="title" header={type + " Title"} sortable />
                        {isCatalog && (
                            <Column field="level" header="Level" body={themeLevelBodyTemplate} sortable />
                        )}
                        {!isCatalog && (
                            <Column field="priority" header="Priority" sortable />
                        )}
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
                    </DataTable>

                    {selectedTheme && (
                        <SaveDialog
                            visible={showSaveDialog}
                            theme={selectedTheme}
                            isCatalog={isCatalog}
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

export default ThemeManager;
