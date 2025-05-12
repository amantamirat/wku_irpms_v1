'use client';
import DeleteDialog from '@/components/DeleteDialog';
import { AcademicLevel, Program, Classification } from '@/models/program';
import { ProgramService } from '@/services/ProgramService';
import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import SaveDialog from './dialog/SaveDialog';
import { Department } from '@/models/department';

interface ProgramCompProps {
    department: Department;
}

const ProgramComp = (props: ProgramCompProps) => {
    let emptyProgram: Program = {
        department: props.department,
        program_name: '',
        academic_level: AcademicLevel.BA,
        classification: Classification.Regular
    };


    const [programs, setPrograms] = useState<Program[]>([]);
    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [selectedProgram, setSelectedProgram] = useState<Program>(emptyProgram);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const toast = useRef<Toast>(null);

    const loadPrograms = useCallback(async () => {
        try {
            const data = await ProgramService.getProgramsByDepartment(props.department);
            setPrograms(data);
        } catch (err) {
            console.error('Failed to load programs:', err);
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to load programs data',
                detail: '' + err,
                life: 3000
            });
        }
    }, [props.department]);

    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
        loadPrograms();
    }, [loadPrograms]);

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };

    const saveProgram = async () => {
        try {
            let _programs = [...(programs as any)];
            if (selectedProgram._id) {
                const updatedProgram = await ProgramService.updateProgram(selectedProgram);
                const index = programs.findIndex((program) => program._id === selectedProgram._id);
                _programs[index] = updatedProgram;
            } else {
                const newProgram = await ProgramService.createProgram(selectedProgram);
                _programs.push(newProgram);
            }
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: `Program ${selectedProgram._id ? "updated" : 'created'}`,
                life: 3000
            });
            setPrograms(_programs);
        } catch (error) {
            console.error(error);
            toast.current?.show({
                severity: 'error',
                summary: `Failed to ${selectedProgram._id ? "update" : 'create'} program`,
                detail: '' + error,
                life: 3000
            });
        } finally {
            setShowSaveDialog(false);
            setSelectedProgram(emptyProgram);
        }

    };


    const deleteProgram = async () => {
        try {
            const deleted = await ProgramService.deleteProgram(selectedProgram);
            if (deleted) {
                let _programs = (programs as any)?.filter((val: any) => val._id !== selectedProgram._id);
                setPrograms(_programs);
                toast.current?.show({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Program Deleted',
                    life: 3000
                });
            }
        } catch (error) {
            console.error(error);
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to delete programs',
                detail: '' + error,
                life: 3000
            });
        } finally {
            setShowDeleteDialog(false);
            setSelectedProgram(emptyProgram);
        }

    };

    const openSaveDialog = (program: Program) => {
        setSelectedProgram({ ...program });
        setShowSaveDialog(true);
    };


    const hideSaveDialog = () => {
        setShowSaveDialog(false);
        setSelectedProgram(emptyProgram);
    };

    const confirmDeleteItem = (program: Program) => {
        setSelectedProgram(program);
        setShowDeleteDialog(true);
    };

    const startToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="New Program" icon="pi pi-plus" severity="success" className="mr-2" onClick={() => openSaveDialog(emptyProgram)} />
                </div>
            </React.Fragment>
        );
    };



    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Manage Programs</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" value={globalFilter} onChange={onGlobalFilterChange} placeholder="Search..." className="w-full md:w-1/3" />
            </span>
        </div>
    );

    const actionBodyTemplate = (rowData: Program) => {
        return (
            <>
                <Button icon="pi pi-pencil" rounded severity="success" className="p-button-rounded p-button-text"
                    style={{ fontSize: '2rem' }} onClick={() => openSaveDialog(rowData)} />
                <Button icon="pi pi-trash" rounded severity="warning" className="p-button-rounded p-button-text"
                    style={{ fontSize: '2rem' }} onClick={() => confirmDeleteItem(rowData)} />
            </>
        );
    };

    const academicLevelBodyTemplate = (rowData: Program) => {
        return (
            <span className={`academic-badge level-${rowData.academic_level.toLowerCase()}`}>
                {rowData.academic_level}
            </span>
        );
    };

    const classificationBodyTemplate = (rowData: Program) => {
        return (
            <span className={`classification-badge classification-${rowData.classification.toLowerCase()}`}>
                {rowData.classification}
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
                        value={programs}
                        selection={selectedProgram}
                        onSelectionChange={(e) => setSelectedProgram(e.value as Program)}
                        dataKey="_id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} programs"
                        globalFilter={globalFilter}
                        emptyMessage={`No program data found for ${props.department.department_name}.`}
                        header={header}
                        scrollable
                        filters={filters}
                        onRowDoubleClick={(e) => {
                            const selected = e.data;
                            if (selected) {
                                setSelectedProgram(selected as Program);
                            }
                        }}
                    >
                        <Column selectionMode="single" headerStyle={{ width: '3em' }}></Column>
                        <Column
                            header="#"
                            body={(rowData, options) => options.rowIndex + 1}
                            style={{ width: '50px' }}
                        />
                        <Column field="program_name" header="Program Name" sortable headerStyle={{ minWidth: '15rem' }} />
                        <Column field="academic_level" header="Ac. Level" body={academicLevelBodyTemplate} sortable />
                        <Column field="classification" header="Classification" body={classificationBodyTemplate} sortable />
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
                    </DataTable>

                    {selectedProgram &&
                        <SaveDialog
                            visible={showSaveDialog}
                            program={selectedProgram}
                            setProgram={setSelectedProgram}
                            onSave={saveProgram}
                            onHide={hideSaveDialog}
                        />}
                    {selectedProgram &&
                        <DeleteDialog
                            showDeleteDialog={showDeleteDialog}
                            selectedDataInfo={selectedProgram.program_name}
                            onDelete={deleteProgram}
                            onHide={() => setShowDeleteDialog(false)}
                        />}
                </div>
            </div>
        </div>
    );
};

export default ProgramComp;
