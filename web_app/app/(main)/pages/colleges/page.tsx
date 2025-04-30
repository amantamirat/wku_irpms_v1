'use client';
import DeleteDialog from '@/components/DeleteDialog';
import { College, validateCollege } from '@/models/college';
import { CollegeService } from '@/services/CollegeService';
import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import SaveDialog from './components/SaveDialog';



const CollegePage = () => {
    let emptyCollege: College = {
        college_name: ''
    };
    const [colleges, setColleges] = useState<College[]>([]);
    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});

    const [selectedCollege, setSelectedCollege] = useState<College>(emptyCollege);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const toast = useRef<Toast>(null);


    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
        loadColleges();
    }, []);

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };

    const loadColleges = async () => {
        try {
            const data = await CollegeService.getColleges();
            setColleges(data);
        } catch (err) {
            console.error('Failed to load colleges:', err);
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to load colleges data',
                detail: '' + err,
                life: 3000
            });
        }
    };



    const saveCollege = async () => {
        setSubmitted(true);
        if (!validateCollege(selectedCollege)) {
            return;
        }
        try {
            let _colleges = [...(colleges as any)];
            if (selectedCollege._id) {
                const updatedCollege = await CollegeService.updateCollege(selectedCollege);
                const index = colleges.findIndex((college) => college._id === selectedCollege._id);
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
            setColleges(_colleges);
        } catch (error) {
            console.error(error);
            toast.current?.show({
                severity: 'error',
                summary: `Failed to ${selectedCollege._id ? "update" : 'create'} college`,
                detail: '' + error,
                life: 3000
            });
        } finally {
            setShowSaveDialog(false);
            setSelectedCollege(emptyCollege);
        }

    };


    const deleteCollege = async () => {
        try {
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
        } catch (error) {
            console.error(error);
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to delete colleges',
                detail: '' + error,
                life: 3000
            });
        } finally {
            setShowDeleteDialog(false);
            setSelectedCollege(emptyCollege);
        }

    };

    const openSaveDialog = (college: College) => {
        setSelectedCollege({ ...college });
        setSubmitted(false);
        setShowSaveDialog(true);
    };


    const hideSaveDialog = () => {
        setShowSaveDialog(false);
        setSubmitted(false);
        setSelectedCollege(emptyCollege);
    };



    const confirmDeleteItem = (college: College) => {
        setSelectedCollege(college);
        setShowDeleteDialog(true);
    };




    const startToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="New College" icon="pi pi-plus" severity="success" className="mr-2" onClick={() => openSaveDialog(emptyCollege)} />
                </div>
            </React.Fragment>
        );
    };



    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Manage Colleges</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" value={globalFilter} onChange={onGlobalFilterChange} placeholder="Search..." className="w-full md:w-1/3" />
            </span>
        </div>
    );

    const actionBodyTemplate = (rowData: College) => {
        return (
            <>
                <Button icon="pi pi-pencil" rounded severity="success" className="p-button-rounded p-button-text"
                    style={{ fontSize: '2rem' }} onClick={() => openSaveDialog(rowData)} />
                <Button icon="pi pi-trash" rounded severity="warning" className="p-button-rounded p-button-text"
                    style={{ fontSize: '2rem' }} onClick={() => confirmDeleteItem(rowData)} />
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
                        emptyMessage="No college data found."
                        header={header}
                        scrollable
                        filters={filters}
                        onRowDoubleClick={(e) => {
                            const selected = e.data;
                            if (selected) {
                                setSelectedCollege(selected as College);
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

                    <SaveDialog
                        visible={showSaveDialog}
                        college={selectedCollege}
                        submitted={submitted}
                        onChange={setSelectedCollege}
                        onSave={saveCollege}
                        onHide={hideSaveDialog}
                    />

                    <DeleteDialog
                        showDeleteDialog={showDeleteDialog}
                        selectedDataInfo={selectedCollege.college_name}
                        onDelete={deleteCollege}
                        onHide={() => setShowDeleteDialog(false)}
                    />

                </div>
            </div>
        </div>
    );
};

export default CollegePage;
