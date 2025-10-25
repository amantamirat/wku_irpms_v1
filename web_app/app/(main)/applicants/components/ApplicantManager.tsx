'use client';

import ConfirmDialog from '@/components/ConfirmationDialog';
import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ApplicantApi } from '../api/applicant.api';
import { Applicant, Gender, Scope, scopeToOrganizationUnit } from '../models/applicant.model';
import SaveDialog from './dialogs/SaveDialog';
import { useAuth } from '@/contexts/auth-context';


interface ApplicantManagerProps {
    scope: Scope;
}

const ApplicantManager = ({ scope }: ApplicantManagerProps) => {

    const emptyApplicant: Applicant = {
        first_name: '',
        last_name: '',
        organization: '',
        birth_date: new Date(),
        gender: Gender.Male,
        scope: scope,
    };

    const isAcademic = scope === Scope.academic;
    const isSupportive = scope === Scope.supportive;
    const isExternal = scope === Scope.external;

    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});

    const { getOrganizationsByType } = useAuth();
    const [userOrganizations, setUserOrganizations] = useState<string[]>([]);

    const [selectedApplicant, setSelectedApplicant] = useState<Applicant>(emptyApplicant);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showLinkDialog, setShowLinkDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const toast = useRef<Toast>(null);

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };

    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
    }, []);


    const loadApplicants = useCallback(async () => {
        try {
            const type = scopeToOrganizationUnit[scope]; // map scope to org type
            if (!type) return;

            const orgs = getOrganizationsByType(type).map((org) => org._id);

            if (orgs.length === 0) {
                // No organizations available for this scope, skip fetching
                setApplicants([]);
                return;
            }

            const data = await ApplicantApi.getApplicants({
                scope,
                organization: orgs, // array of IDs
            });
            setApplicants(data);
        } catch (err) {
            console.error('Error loading applicants:', err);
        }
    }, [scope, getOrganizationsByType]);

    useEffect(() => {
        loadApplicants();
    }, [scope, loadApplicants]);



    const onSaveComplete = (savedApplicant: Applicant) => {
        let _applicants = [...applicants]; // applicants is your local state array of Applicant
        const index = _applicants.findIndex((a) => a._id === savedApplicant._id);
        if (index !== -1) {
            _applicants[index] = { ...savedApplicant };
        } else {
            _applicants.push({ ...savedApplicant });
        }
        setApplicants(_applicants); // update state
        hideDialogs(); // close your SaveApplicantDialog
    };


    const deleteApplicant = async () => {
        const deleted = await ApplicantApi.deleteApplicant(selectedApplicant);
        if (deleted) {
            setApplicants(applicants.filter((c) => c._id !== selectedApplicant._id));
            hideDialogs();
        }
    };

    const linkApplicant = async () => {
        let linked = await ApplicantApi.linkApplicant(selectedApplicant);
        linked = {
            ...linked,
            organization: selectedApplicant.organization
        };
        onSaveComplete(linked);
    };

    const hideDialogs = () => {
        setShowSaveDialog(false);
        setShowDeleteDialog(false);
        setShowLinkDialog(false);
        setSelectedApplicant(emptyApplicant);
    }

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
            {!rowData.user && <Button icon="pi pi-user-plus" rounded severity="secondary" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setSelectedApplicant(rowData);
                    setShowLinkDialog(true);
                }} />}
            <Button icon="pi pi-pencil" rounded severity="success" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
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

    const genderBodyTemplate = (rowData: Applicant) => {
        return (
            <span className={`gender-badge gender-${rowData.gender.toLowerCase()}`}>
                {rowData.gender}
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
                        <Column field="gender" header="Gender" body={genderBodyTemplate} sortable />
                        <Column field="birth_date" header="Birth Date" body={(rowData) => new Date(rowData.birth_date!).toLocaleDateString('en-CA')} />
                        <Column field="organization.name" header={isAcademic ? "Department" : isSupportive ? "Office" : "Organization"} sortable />
                        <Column field="email" header="Email" sortable />
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '15rem' }}></Column>
                    </DataTable>

                    {selectedApplicant && (
                        <SaveDialog
                            visible={showSaveDialog}
                            applicant={selectedApplicant}
                            onComplete={onSaveComplete}
                            onHide={() => setShowSaveDialog(false)}
                        />
                    )}

                    {selectedApplicant && (
                        <ConfirmDialog
                            showDialog={showDeleteDialog}
                            selectedDataInfo={`${selectedApplicant.first_name} ${selectedApplicant.last_name}`}
                            onConfirmAsync={deleteApplicant}
                            onHide={hideDialogs}
                        />
                    )}


                    {selectedApplicant && (
                        <ConfirmDialog
                            showDialog={showLinkDialog}
                            selectedDataInfo={`${selectedApplicant.first_name} ${selectedApplicant.last_name}`}
                            operation='Link'
                            onConfirmAsync={linkApplicant}
                            onHide={hideDialogs}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ApplicantManager;
