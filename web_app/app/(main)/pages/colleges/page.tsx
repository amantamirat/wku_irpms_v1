'use client';
import { College } from '@/models/college';
import { CollegeService } from '@/services/CollegeService';
import { FilterMatchMode } from 'primereact/api';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { classNames } from 'primereact/utils';
import React, { useEffect, useRef, useState } from 'react';



const CollegePage = () => {
    let emptyCollege: College = {
        college_name: ''
    };
    const [colleges, setColleges] = useState<College[]>([]);
    const [selectedCollege, setSelectedCollege] = useState<College>(emptyCollege);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const toast = useRef<Toast>(null);
    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});

    useEffect(() => {
        initFilters();
        loadColleges();
    }, []);

    const loadColleges = async () => {
        try {
            CollegeService.getColleges().then((data) => {
                setColleges(data);
            });
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to load colleges',
                detail: '' + err,
                life: 3000
            });
        }
    };

    const validateCollege = (college: College) => {
        if (college.college_name.trim() === "") {
            return false;
        }
        //check for uniqness here
        return true;
    };

    const saveCollege = async () => {
        setSubmitted(true);
        if (!validateCollege(selectedCollege)) {
            return;
        }
        let _colleges = [...(colleges as any)];
        try {
            if (selectedCollege._id) {
                const updatedCollege = await CollegeService.updateCollege(selectedCollege);                
                const index = colleges.findIndex((college) => college._id === updatedCollege._id);
                _colleges[index] = updatedCollege;
            } else {
                const newCollege = await CollegeService.createCollege(selectedCollege);
                _colleges.push(newCollege);
            }
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: `College ${selectedCollege._id ? "updated" : 'created'}`,
                life: 3000
            });
        } catch (error) {
            console.error(error);
            toast.current?.show({
                severity: 'error',
                summary: `Failed to ${selectedCollege._id ? "update" : 'create'} college`,
                detail: '' + error,
                life: 3000
            });
        }

        setColleges(_colleges as any);
        setShowSaveDialog(false);
        setSelectedCollege(emptyCollege);

    };


    

    const deleteCollege = async () => {
        try {
            if (selectedCollege._id) {
                const deleted = await CollegeService.deleteCollege(selectedCollege);
                if (deleted) {
                    let _colleges = (colleges as any)?.filter((val: any) => val._id !== selectedCollege._id);
                    setColleges(_colleges);
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Successful',
                        detail: 'College Deleted',
                        life: 3000
                    });
                }
            }
        } catch (error) {
            console.error(error);
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to delete colleges',
                detail: '' + error,
                life: 3000
            });
        }
        setShowDeleteDialog(false);
        setSelectedCollege(emptyCollege);
    };

    const openSaveDialog = () => {
        setSelectedCollege(emptyCollege);
        setSubmitted(false);
        setShowSaveDialog(true);
    };

    const openEditDialog = (college: College) => {
        setSelectedCollege({ ...college });
        setSubmitted(false);
        setShowSaveDialog(true);
    };

    const hideSaveDialog = () => {
        setSubmitted(false);
        setShowSaveDialog(false);
    };

    const saveDialogFooter = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={hideSaveDialog} />
            <Button label="Save" icon="pi pi-check" text onClick={saveCollege} />
        </>
    );

    const confirmDeleteItem = (college: College) => {
        setSelectedCollege(college);
        setShowDeleteDialog(true);
    };

    const hideDeleteDialog = () => {
        setShowDeleteDialog(false);
    };

    const deleteDialogFooter = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={hideDeleteDialog} />
            <Button label="Delete" icon="pi pi-check" text onClick={deleteCollege} />
        </>
    );


    const startToolbarTemplate = () => {
        //<React.Fragment> is simillar to <></>
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="New College" icon="pi pi-plus" severity="success" className="mr-2" onClick={openSaveDialog} />
                </div>
            </React.Fragment>
        );
    };

    const initFilters = () => {
        setFilters({
            global: { value: null, matchMode: FilterMatchMode.CONTAINS }
        });
        setGlobalFilter('');
    };

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        let _filters = { ...filters };
        (_filters['global'] as any).value = value;
        setFilters(_filters);
        setGlobalFilter(value);
    };

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Manage Colleges</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" value={globalFilter} onChange={onGlobalFilterChange} placeholder="Search ..." className="w-full md:w-1/3" />
            </span>
        </div>
    );

    const actionBodyTemplate = (rowData: College) => {
        return (
            <>
                <Button icon="pi pi-pencil" rounded severity="success" className="mr-2" onClick={() => openEditDialog(rowData)} />
                <Button icon="pi pi-trash" rounded severity="warning" onClick={() => confirmDeleteItem(rowData)} />
            </>
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
                        value={colleges}
                        selection={selectedCollege}
                        onSelectionChange={(e) => setSelectedCollege(e.value as College)}
                        dataKey="_id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} colleges"
                        globalFilter={globalFilter}
                        emptyMessage="No colleges found."
                        header={header}
                        scrollable
                        filters={filters}
                        onRowDoubleClick={(e) => {
                            const selected = e.data;  // The selected row data
                            if (selected) {
                                setSelectedCollege(selected as College);
                                // Perform any further logic like opening a modal or navigating
                            }
                        }}
                    >
                        <Column selectionMode="single" headerStyle={{ width: '3em' }}></Column>
                        <Column
                            header="#"
                            body={(rowData, options) => options.rowIndex + 1}
                            style={{ width: '50px' }}
                        />
                        <Column field="college_name" header="College Name" sortable headerStyle={{ minWidth: '15rem' }}></Column>
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
                    </DataTable>

                    <Dialog
                        visible={showSaveDialog}
                        style={{ width: '450px' }}
                        header={selectedCollege?._id ? 'Edit College Details' : 'New College Details'}
                        modal
                        className="p-fluid"
                        footer={saveDialogFooter}
                        onHide={hideSaveDialog}
                    >
                        {selectedCollege ? (<>
                            <div className="field">
                                <label htmlFor="name">College Name</label>
                                <InputText
                                    id="name"
                                    value={selectedCollege.college_name}
                                    onChange={(e) => setSelectedCollege({ ...selectedCollege, college_name: e.target.value })}
                                    required
                                    autoFocus
                                    className={classNames({
                                        'p-invalid': submitted && !selectedCollege.college_name,
                                    })}
                                />
                                {submitted && !selectedCollege.college_name && <small className="p-invalid">College Name is required.</small>}
                            </div>
                        </>) : (<></>)}
                    </Dialog>

                    <Dialog
                        visible={showDeleteDialog}
                        style={{ width: '450px' }}
                        header="Confirm"
                        modal
                        footer={deleteDialogFooter}
                        onHide={hideDeleteDialog}
                    >
                        <div className="flex align-items-center justify-content-center">
                            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                            {selectedCollege && (
                                <span>
                                    Are you sure you want to delete <b>{selectedCollege.college_name}</b>?
                                </span>
                            )}
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    );
};

export default CollegePage;
