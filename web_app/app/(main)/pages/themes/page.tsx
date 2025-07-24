'use client';

import DeleteDialog from '@/components/DeleteDialog';
import { Directorate } from '@/models/directorate';
import { Theme, ThemeStatus } from '@/models/theme';
import { DirectorateService } from '@/services/DirectorateService';
import { ThemeService2 } from '@/services/ThemeService';
import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableExpandedRows, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import SaveDialog from './dialogs/SaveDialog';
import PriorityAreaComp from '../../components/priorityArea/PriorityArea';

const ThemePage = () => {

    const searchParams = useSearchParams();
    const router = useRouter();
    const directorateId = searchParams.get('directorate');
    const [directorate, setDirectorate] = useState<Directorate | null>(null);

    const shouldRedirect = !directorateId;

    useEffect(() => {
        if (shouldRedirect) {
            router.push('/');
        }
    }, [shouldRedirect, router]);

    if (shouldRedirect) {
        return null;
    }


    const emptyTheme: Theme = {
        directorate: directorate || '',
        title: '',
        status: ThemeStatus.Active,
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


    useEffect(() => {
        if (directorateId) {
            DirectorateService.getDirectorateByID(directorateId)
                .then((result) => {
                    if (!result) {
                        router.push('/auth/error'); // redirect if not found
                    } else {
                        setDirectorate(result);
                    }
                })
                .catch(() => {
                    router.push('/auth/error'); // also handle fetch errors
                });
        } else {
            // if no directorateId param, optionally redirect or handle differently
            router.push('/auth/error');
        }
    }, [directorateId, router]);

    const loadThemes = async () => {
        try {
            if (!directorate) return;
            const data = await ThemeService2.getThemesByDirectorate(directorate);
            setThemes(data);
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to load theme data',
                detail: '' + err,
                life: 3000
            });
        }
    };

    useEffect(() => {
        if (directorate) {
            loadThemes();
        }
    }, [directorate])

    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
    }, []);


    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };

    const saveTheme = async () => {
        try {
            let _themes = [...themes];
            if (selectedTheme._id) {
                const updated = await ThemeService2.updateTheme(selectedTheme);
                const index = _themes.findIndex((c) => c._id === selectedTheme._id);
                _themes[index] = updated;
            } else {
                const created = await ThemeService2.createTheme(selectedTheme);
                _themes.push(created);
            }
            setThemes(_themes);
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: `Theme ${selectedTheme._id ? 'updated' : 'created'}`,
                life: 3000
            });
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
            const deleted = await ThemeService2.deleteTheme(selectedTheme);
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
            <Button label="New Theme" icon="pi pi-plus" severity="success" className="mr-2"
                onClick={() => {
                    setSelectedTheme(emptyTheme);
                    setShowSaveDialog(true);
                }}
            />
        </div>
    );

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Manage {directorate?.directorate_name} Themes</h5>
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

    const statusBodyTemplate = (rowData: Theme) => {
        return (
            <span className={`theme-badge status-${rowData.status.toLowerCase()}`}>
                {rowData.status}
            </span>
        );
    };

    if (!directorate) {
        return <p>Loading...</p>;
    }

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
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} themes"
                        globalFilter={globalFilter}
                        emptyMessage={`No ${directorate.directorate_name} themes data found.`}
                        header={header}
                        scrollable
                        filters={filters}
                        expandedRows={expandedRows}
                        onRowToggle={(e) => setExpandedRows(e.data)}
                        rowExpansionTemplate={(data) => (
                            <PriorityAreaComp
                                theme={data as Theme}
                            />
                        )}
                    >
                        <Column expander style={{ width: '3em' }} />
                        <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                        <Column field="title" header="Title" sortable />
                        <Column field="status" header="Status" body={statusBodyTemplate} sortable />
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

export default ThemePage;
