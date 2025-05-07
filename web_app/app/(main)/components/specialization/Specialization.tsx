'use client';
import DeleteDialog from '@/components/DeleteDialog';
import { Specialization } from '@/models/specialization';
import { SpecializationService } from '@/services/SpecializationService';
import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import SaveDialog from './dialog/SaveDialog';
import { CollegeService } from '@/services/CollegeService';
import { College } from '@/models/college';
import { Department } from '@/models/department';

interface SpecializationCompProps {
    department: Department;
}

const SpecializationComp = (props: SpecializationCompProps) => {
    let emptySpecialization: Specialization = {
        department: props.department,
        specialization_name: '',
        academic_level: 'BA'
    };


    const [specializations, setSpecializations] = useState<Specialization[]>([]);
    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [selectedSpecialization, setSelectedSpecialization] = useState<Specialization>(emptySpecialization);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const toast = useRef<Toast>(null);


    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
        loadSpecializations();
    }, []);

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };



    const loadSpecializations = async () => {
        try {
            const data = await SpecializationService.getSpecializationsByDepartment(props.department);
            setSpecializations(data);
        } catch (err) {
            console.error('Failed to load specializations:', err);
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to load specializations data',
                detail: '' + err,
                life: 3000
            });
        }
    };



    const saveSpecialization = async () => {
        try {
            let _specializations = [...(specializations as any)];
            if (selectedSpecialization._id) {
                const updatedSpecialization = await SpecializationService.updateSpecialization(selectedSpecialization);
                const index = specializations.findIndex((specialization) => specialization._id === selectedSpecialization._id);
                _specializations[index] = updatedSpecialization;
            } else {
                const newSpecialization = await SpecializationService.createSpecialization(selectedSpecialization);
                _specializations.push(newSpecialization);
            }
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: `Specialization ${selectedSpecialization._id ? "updated" : 'created'}`,
                life: 3000
            });
            setSpecializations(_specializations);
        } catch (error) {
            console.error(error);
            toast.current?.show({
                severity: 'error',
                summary: `Failed to ${selectedSpecialization._id ? "update" : 'create'} specialization`,
                detail: '' + error,
                life: 3000
            });
        } finally {
            setShowSaveDialog(false);
            setSelectedSpecialization(emptySpecialization);
        }

    };


    const deleteSpecialization = async () => {
        try {
            const deleted = await SpecializationService.deleteSpecialization(selectedSpecialization);
            if (deleted) {
                let _specializations = (specializations as any)?.filter((val: any) => val._id !== selectedSpecialization._id);
                setSpecializations(_specializations);
                toast.current?.show({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Specialization Deleted',
                    life: 3000
                });
            }
        } catch (error) {
            console.error(error);
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to delete specializations',
                detail: '' + error,
                life: 3000
            });
        } finally {
            setShowDeleteDialog(false);
            setSelectedSpecialization(emptySpecialization);
        }

    };

    const openSaveDialog = (specialization: Specialization) => {
        setSelectedSpecialization({ ...specialization });
        setShowSaveDialog(true);
    };


    const hideSaveDialog = () => {
        setShowSaveDialog(false);
        setSelectedSpecialization(emptySpecialization);
    };

    const confirmDeleteItem = (specialization: Specialization) => {
        setSelectedSpecialization(specialization);
        setShowDeleteDialog(true);
    };

    const startToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="New Specialization" icon="pi pi-plus" severity="success" className="mr-2" onClick={() => openSaveDialog(emptySpecialization)} />
                </div>
            </React.Fragment>
        );
    };



    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Manage Specializations</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" value={globalFilter} onChange={onGlobalFilterChange} placeholder="Search..." className="w-full md:w-1/3" />
            </span>
        </div>
    );

    const actionBodyTemplate = (rowData: Specialization) => {
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
                        value={specializations}
                        selection={selectedSpecialization}
                        onSelectionChange={(e) => setSelectedSpecialization(e.value as Specialization)}
                        dataKey="_id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} specializations"
                        globalFilter={globalFilter}
                        emptyMessage={`No specialization data found for ${props.department.department_name}.`}
                        header={header}
                        scrollable
                        filters={filters}
                        onRowDoubleClick={(e) => {
                            const selected = e.data;
                            if (selected) {
                                setSelectedSpecialization(selected as Specialization);
                            }
                        }}
                    >
                        <Column selectionMode="single" headerStyle={{ width: '3em' }}></Column>
                        <Column
                            header="#"
                            body={(rowData, options) => options.rowIndex + 1}
                            style={{ width: '50px' }}
                        />
                        <Column field="specialization_name" header="Specialization Name" sortable headerStyle={{ minWidth: '15rem' }} />
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
                    </DataTable>

                    <SaveDialog
                        visible={showSaveDialog}
                        specialization={selectedSpecialization}
                        setSpecialization={setSelectedSpecialization}
                        onSave={saveSpecialization}
                        onHide={hideSaveDialog}
                    />

                    <DeleteDialog
                        showDeleteDialog={showDeleteDialog}
                        selectedDataInfo={selectedSpecialization.specialization_name}
                        onDelete={deleteSpecialization}
                        onHide={() => setShowDeleteDialog(false)}
                    />

                </div>
            </div>
        </div>
    );
};

export default SpecializationComp;
