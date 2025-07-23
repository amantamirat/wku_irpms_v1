'use client';

import DeleteDialog from '@/components/DeleteDialog';
import SaveDialog from './dialogs/SaveDialog';
import { Applicant, Gender, Scope } from '@/models/applicant';
import { ApplicantService } from '@/services/ApplicantService';
import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Organization, OrganizationType } from '@/models/organization';
import { OrganizationService } from '@/services/OrganizationService';

interface ApplicantCompProps {
    scope: Scope;
}

const ApplicantComp = (props: ApplicantCompProps) => {

    const emptyApplicant: Applicant = {
        first_name: '',
        last_name: '',
        organization: '',
        birth_date: new Date(),
        gender: Gender.Male,
        scope: props.scope,
    };

    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [selectedApplicant, setSelectedApplicant] = useState<Applicant>(emptyApplicant);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const toast = useRef<Toast>(null);

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };

    const scope = props.scope;

    const loadApplicants = useCallback(async () => {
        try {
            const data = await ApplicantService.getApplicantsByScope(scope);
            setApplicants(data);
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to load applicant data',
                detail: '' + err,
                life: 3000
            });
        }
    }, [scope]);



    const loadOrganizations = useCallback(async () => {
        try {
            if (scope === Scope.academic) {
                const data = await OrganizationService.getOrganizationsByType(OrganizationType.Department);
                setOrganizations(data);
            } else if (scope === Scope.supportive) {
                const data = await OrganizationService.getOrganizationsByType(OrganizationType.Supportive);
                setOrganizations(data);
            }
            else if (scope === Scope.external) {
                const data = await OrganizationService.getOrganizationsByType(OrganizationType.External);
                setOrganizations(data);
            }

        } catch (err) {
            console.error('Failed to load oranizations:', err);
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to load oranizations data',
                detail: '' + err,
                life: 3000
            });
        }
    }, [scope]);

    useEffect(() => {
        loadApplicants();
        loadOrganizations();
    }, [scope]);

    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
    }, []);

    const saveApplicant = async () => {
        try {
            let _applicants = [...applicants];
            if (selectedApplicant._id) {
                const updated = await ApplicantService.updateApplicant(selectedApplicant);
                const index = _applicants.findIndex((c) => c._id === selectedApplicant._id);
                _applicants[index] = selectedApplicant;
            } else {
                const created = await ApplicantService.createApplicant(selectedApplicant);
                _applicants.push({ ...selectedApplicant, _id: created._id });
            }
            setApplicants(_applicants);
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: `Applicant ${selectedApplicant._id ? 'updated' : 'created'}`,
                life: 3000
            });
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to save applicant',
                detail: '' + err,
                life: 3000
            });
        } finally {
            setShowSaveDialog(false);
            setSelectedApplicant(emptyApplicant);
        }
    };

    const deleteApplicant = async () => {
        try {
            const deleted = await ApplicantService.deleteApplicant(selectedApplicant);
            if (deleted) {
                setApplicants(applicants.filter((c) => c._id !== selectedApplicant._id));
                toast.current?.show({
                    severity: 'success',
                    summary: 'Deleted',
                    detail: 'Applicant deleted',
                    life: 3000
                });
            }
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to delete applicant',
                detail: '' + err,
                life: 3000
            });
        } finally {
            setShowDeleteDialog(false);
            setSelectedApplicant(emptyApplicant);
        }
    };

    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button label="New Applicant" icon="pi pi-plus" severity="success" className="mr-2"
                onClick={() => {
                    setSelectedApplicant(emptyApplicant);
                    setShowSaveDialog(true);
                }}
            />
        </div>
    );



    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Manage {scope}</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" value={globalFilter} onChange={onGlobalFilterChange} placeholder="Search..." className="w-full md:w-1/3" />
            </span>
        </div>
    );

    const actionBodyTemplate = (rowData: Applicant) => (
        <>
            <Button icon="pi pi-pencil" rounded severity="success" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    // const matchedRank = ranks.find(r => r._id === (rowData.rank as Rank)?._id);
                    //const matchedDepartment = departments.find(d => d._id === (rowData.department as Department)?._id);
                    //setSelectedApplicant({ ...rowData, rank: matchedRank ?? '', department: matchedDepartment });
                    setSelectedApplicant(rowData);
                    setShowSaveDialog(true);
                }} />
            <Button icon="pi pi-trash" rounded severity="warning" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setSelectedApplicant(rowData);
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
                        value={applicants}
                        selection={selectedApplicant}
                        onSelectionChange={(e) => setSelectedApplicant(e.value as Applicant)}
                        dataKey="_id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} applicants"
                        globalFilter={globalFilter}
                        emptyMessage={`No ${scope} data found.`}
                        header={header}
                        scrollable
                        filters={filters}
                        tableStyle={{ minWidth: '50rem' }}
                    >
                        <Column selectionMode="single" headerStyle={{ width: '3em' }}></Column>
                        <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                        <Column field="first_name" header="First Name" sortable />
                        <Column field="last_name" header="Last Name" sortable />
                        <Column field="gender" header="Gender" sortable />
                        <Column field="birth_date" header="Birth Date" body={(rowData) => new Date(rowData.birth_date!).toLocaleDateString()} />

                        {
                            scope === Scope.academic &&
                            <Column field="department.department_name" header="Department" sortable />
                        }
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
                    </DataTable>

                    {selectedApplicant && (
                        <SaveDialog
                            visible={showSaveDialog}
                            ranks={[]}
                            departments={scope === Scope.academic ? [] : undefined}
                            applicant={selectedApplicant}
                            setApplicant={setSelectedApplicant}
                            onSave={saveApplicant}
                            onHide={() => setShowSaveDialog(false)}
                        />
                    )}

                    {selectedApplicant && (
                        <DeleteDialog
                            showDeleteDialog={showDeleteDialog}
                            selectedDataInfo={`${selectedApplicant.first_name} ${selectedApplicant.last_name}`}
                            onDelete={deleteApplicant}
                            onHide={() => setShowDeleteDialog(false)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ApplicantComp;
