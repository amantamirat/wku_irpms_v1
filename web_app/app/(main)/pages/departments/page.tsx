'use client';
import DeleteDialog from '@/components/DeleteDialog';
import { Department } from '@/models/department';
import { DepartmentService } from '@/services/DepartmentService';
import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableExpandedRows, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import SaveDialog from './dialogs/SaveDialog';
import { CollegeService } from '@/services/CollegeService';
import { College } from '@/models/college';
import SpecializationComp from '../../components/specialization/Specialization';



const DepartmentPage = () => {
    let emptyDepartment: Department = {
        college: '',
        department_name: '',
    };
    const [colleges, setColleges] = useState<College[]>([]);

    const [departments, setDepartments] = useState<Department[]>([]);
    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [selectedDepartment, setSelectedDepartment] = useState<Department>(emptyDepartment);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const toast = useRef<Toast>(null);
    const [expandedRows, setExpandedRows] = useState<any[] | DataTableExpandedRows>([]);


    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
        loadColleges();
        loadDepartments();
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
                summary: 'Failed to load college data',
                detail: '' + err,
                life: 3000
            });
        }
    };

    const loadDepartments = async () => {
        try {
            const data = await DepartmentService.getDepartments();
            setDepartments(data);
        } catch (err) {
            console.error('Failed to load departments:', err);
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to load departments data',
                detail: '' + err,
                life: 3000
            });
        }
    };

    const saveDepartment = async () => {
        try {
            let _departments = [...(departments as any)];
            if (selectedDepartment._id) {
                const updatedDepartment = await DepartmentService.updateDepartment(selectedDepartment);
                const index = departments.findIndex((department) => department._id === selectedDepartment._id);
                _departments[index] = updatedDepartment;
            } else {
                const newDepartment = await DepartmentService.createDepartment(selectedDepartment);
                const department = { ...newDepartment, college: selectedDepartment.college }
                _departments.push(department);
            }
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: `Department ${selectedDepartment._id ? "updated" : 'created'}`,
                life: 3000
            });
            setDepartments(_departments);
        } catch (error) {
            console.error(error);
            toast.current?.show({
                severity: 'error',
                summary: `Failed to ${selectedDepartment._id ? "update" : 'create'} department`,
                detail: '' + error,
                life: 3000
            });
        } finally {
            setShowSaveDialog(false);
            setSelectedDepartment(emptyDepartment);
        }

    };


    const deleteDepartment = async () => {
        try {
            const deleted = await DepartmentService.deleteDepartment(selectedDepartment);
            if (deleted) {
                let _departments = (departments as any)?.filter((val: any) => val._id !== selectedDepartment._id);
                setDepartments(_departments);
                toast.current?.show({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Department Deleted',
                    life: 3000
                });
            }
        } catch (error) {
            console.error(error);
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to delete departments',
                detail: '' + error,
                life: 3000
            });
        } finally {
            setShowDeleteDialog(false);
            setSelectedDepartment(emptyDepartment);
        }

    };

    const openSaveDialog = (department: Department) => {
        setSelectedDepartment({ ...department });
        setShowSaveDialog(true);
    };


    const hideSaveDialog = () => {
        setShowSaveDialog(false);
        setSelectedDepartment(emptyDepartment);
    };

    const confirmDeleteItem = (department: Department) => {
        setSelectedDepartment(department);
        setShowDeleteDialog(true);
    };

    const startToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="New Department" icon="pi pi-plus" severity="success" className="mr-2" onClick={() => openSaveDialog(emptyDepartment)} />
                </div>
            </React.Fragment>
        );
    };



    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Manage Departments</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" value={globalFilter} onChange={onGlobalFilterChange} placeholder="Search..." className="w-full md:w-1/3" />
            </span>
        </div>
    );

    const actionBodyTemplate = (rowData: Department) => {
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
                        value={departments}
                        selection={selectedDepartment}
                        onSelectionChange={(e) => setSelectedDepartment(e.value as Department)}
                        dataKey="_id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} departments"
                        globalFilter={globalFilter}
                        emptyMessage="No department data found."
                        header={header}
                        scrollable
                        filters={filters}
                        onRowDoubleClick={(e) => {
                            const selected = e.data;
                            if (selected) {
                                setSelectedDepartment(selected as Department);
                            }
                        }}
                        expandedRows={expandedRows}
                        onRowToggle={(e) => setExpandedRows(e.data)}
                        rowExpansionTemplate={(data) => (
                            <SpecializationComp
                                department={data as Department}
                            />
                        )}
                    >
                        <Column expander style={{ width: '3em' }} />
                        <Column
                            header="#"
                            body={(rowData, options) => options.rowIndex + 1}
                            style={{ width: '50px' }}
                        />
                        <Column field="department_name" header="Department Name" sortable headerStyle={{ minWidth: '15rem' }} />
                        <Column field="college.college_name" header="College" sortable headerStyle={{ minWidth: '15rem' }} />
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
                    </DataTable>

                    <SaveDialog
                        visible={showSaveDialog}
                        colleges={colleges}
                        department={selectedDepartment}
                        setDepartment={setSelectedDepartment}
                        onSave={saveDepartment}
                        onHide={hideSaveDialog}
                    />

                    <DeleteDialog
                        showDeleteDialog={showDeleteDialog}
                        selectedDataInfo={selectedDepartment.department_name}
                        onDelete={deleteDepartment}
                        onHide={() => setShowDeleteDialog(false)}
                    />

                </div>
            </div>
        </div>
    );
};

export default DepartmentPage;
