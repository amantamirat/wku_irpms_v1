'use client';

import ConfirmDialog from '@/components/ConfirmationDialog';
import ErrorComponent from '@/components/ErrorComponent';
import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableExpandedRows, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ThemeApi } from '../api/theme.api';
import { Theme, ThemeLevel, ThemeType } from '../models/theme.model';
import SaveDialog from './dialogs/SaveDialog';

interface ThemeManagerProps {
    type: ThemeType;
    //directorate?: any;
    parent?: Theme;
    themeLevel?: ThemeLevel;
}

const ThemeManager = ({ type, parent, themeLevel }: ThemeManagerProps) => {

    // Identify type-level hierarchy
    const isThematicArea = type === ThemeType.thematic_area;
    const isBroadTheme = type === ThemeType.broadTheme;
    const isSubTheme = type === ThemeType.componenet;
    const isBroadLevel = themeLevel === ThemeLevel.broad;
    const isComponentLevel = themeLevel === ThemeLevel.componenet;

    const childType = isThematicArea
        ? ThemeType.broadTheme
        : isBroadTheme
            ? ThemeType.componenet
            : isSubTheme
                ? ThemeType.focusArea
                : null;

    const isSelectionOnly =
        !childType ||
        (isBroadLevel && isBroadTheme) ||
        (isComponentLevel && isSubTheme);

    const emptyTheme: Theme = {
        title: '',
        type,
        directorate: '',
        parent,
    };

    // Local States
    const [themes, setThemes] = useState<Theme[]>([]);
    const [selectedTheme, setSelectedTheme] = useState<Theme>(emptyTheme);
    const [error, setError] = useState<string | null>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [expandedRows, setExpandedRows] = useState<any[] | DataTableExpandedRows>([]);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [loading, setLoading] = useState(false);
    //const toast = useRef<Toast>(null);
    const dt = useRef<DataTable<any>>(null);

    // Initialize filters
    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
    }, []);

    // Fetch themes
    const fetchThemes = useCallback(async () => {
        try {
            setLoading(true);
            let data: Theme[] = [];
            if (isThematicArea) {
                data = await ThemeApi.getUserThemes();
            } else if (parent) {
                data = await ThemeApi.getThemes({
                    type,
                    parent: parent._id || '',
                });
            }
            setThemes(data);
        } catch (err) {
            setError(`Failed to load ${type} data: ${err}`);
        } finally {
            setLoading(false);
        }
    }, [type, parent, isThematicArea]);

    useEffect(() => {
        fetchThemes();
    }, [fetchThemes]);

    // Error state
    if (error) {
        return <ErrorComponent errorMessage={error} />;
    }

    // Dialog Control
    const hideDialogs = () => {
        setShowSaveDialog(false);
        setShowDeleteDialog(false);
        setSelectedTheme(emptyTheme);
    };

    // Save complete callback
    const onSaveComplete = (savedTheme: Theme) => {
        let _themes = [...themes];
        const index = _themes.findIndex((t) => t._id === savedTheme._id);
        if (index !== -1) {
            _themes[index] = { ...savedTheme };
        } else {
            _themes.push({ ...savedTheme });
        }
        setThemes(_themes);
        hideDialogs();
    };

    // Delete theme
    const deleteTheme = async () => {
        const deleted = await ThemeApi.deleteTheme(selectedTheme);
        if (deleted) {
            setThemes(themes.filter((c) => c._id !== selectedTheme._id));
            hideDialogs();
        }
    };

    // Search
    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };

    // Toolbar
    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button
                label={`New ${type}`}
                icon="pi pi-plus"
                severity="success"
                onClick={() => {
                    setSelectedTheme(emptyTheme);
                    setShowSaveDialog(true);
                }}
            />
        </div>
    );

    // Table Header
    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">
                Manage {type}s {parent?.title && `in ${parent.title}`}
            </h5>
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

    // Level Badge
    const themeLevelBodyTemplate = (rowData: Theme) => (
        <span className={`theme-level-badge theme-${rowData.level}`}>
            {rowData.level}
        </span>
    );

    // Actions
    const actionBodyTemplate = (rowData: Theme) => (
        <>
            <Button
                icon="pi pi-pencil"
                rounded
                severity="success"
                className="p-button-rounded p-button-text"
                onClick={() => {
                    setSelectedTheme(rowData);
                    setShowSaveDialog(true);
                }}
            />
            <Button
                icon="pi pi-trash"
                rounded
                severity="warning"
                className="p-button-rounded p-button-text"
                onClick={() => {
                    setSelectedTheme(rowData);
                    setShowDeleteDialog(true);
                }}
            />
        </>
    );

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">                    
                    <Toolbar className="mb-4" start={startToolbarTemplate} />
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
                        emptyMessage={`No ${type} data found.`}
                        header={header}
                        scrollable
                        filters={filters}
                        loading={loading}
                        expandedRows={expandedRows}
                        onRowToggle={(e) => setExpandedRows(e.data)}
                        rowExpansionTemplate={(rowData) => {
                            const rowTheme = rowData as Theme;
                            if (isSelectionOnly) return null;
                            return (
                                <ThemeManager
                                    type={childType!}
                                    parent={rowTheme}
                                    themeLevel={themeLevel}
                                />
                            );
                        }}
                    >
                        {isSelectionOnly ? (
                            <Column selectionMode="single" style={{ width: '3em' }} />
                        ) : (
                            <Column expander style={{ width: '3em' }} />
                        )}
                        <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                        {isThematicArea &&
                            <Column field="directorate.name" header="Directorate" sortable />
                        }
                        <Column field="title" header={`${type} Title`} sortable />
                        {isThematicArea ? (
                            <Column field="level" header="Level" body={themeLevelBodyTemplate} sortable />
                        ) : (
                            <Column field="priority" header="Priority" sortable />
                        )}
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }} />
                    </DataTable>

                    {selectedTheme && (
                        <SaveDialog
                            visible={showSaveDialog}
                            theme={selectedTheme}
                            onComplete={onSaveComplete}
                            onHide={() => setShowSaveDialog(false)}
                        />
                    )}

                    {selectedTheme && (
                        <ConfirmDialog
                            showDialog={showDeleteDialog}
                            selectedDataInfo={String(selectedTheme.title)}
                            onConfirmAsync={deleteTheme}
                            onHide={() => setShowDeleteDialog(false)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ThemeManager;
