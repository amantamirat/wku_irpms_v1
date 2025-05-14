'use client';

import DeleteDialog from '@/components/DeleteDialog';
import SaveDialog from './dialogs/SaveDialog';
import { Applicant, Gender } from '@/models/applicant';
import { ApplicantService } from '@/services/ApplicantService';
import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Category } from '@/models/position';
import { RankService } from '@/services/RankService';
import { Rank } from '@/models/rank';

const ApplicantPage = () => {

    const router = useRouter();
    const searchParams = useSearchParams();
    const typeParam = searchParams.get('type');
    const type = typeParam ? parseInt(typeParam, 10) : NaN;

    const category =
        type === 1 ? Category.academic :
            type === 2 ? Category.supportive :
                type === 3 ? Category.external :
                    undefined;

    useEffect(() => {
        if (category === undefined) {
            router.push('/');
        }
    }, [category, router]);

    if (category === undefined) return null;

    const emptyApplicant: Applicant = {
        first_name: '',
        last_name: '',
        birth_date: new Date(),
        gender: Gender.Male,
        rank: ''
    };
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [ranks, setRanks] = useState<Rank[]>([]);
    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [selectedApplicant, setSelectedApplicant] = useState<Applicant>(emptyApplicant);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const toast = useRef<Toast>(null);

    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
        loadApplicants();
        loadRanks();
    }, []);

    const loadApplicants = async () => {
        try {
            const data = await ApplicantService.getApplicants();
            setApplicants(data);
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to load applicant data',
                detail: '' + err,
                life: 3000
            });
        }
    };

    const loadRanks = async () => {
        try {
            const data = await RankService.getRanksByCategory(category);
            setRanks(data);
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to load applicant data',
                detail: '' + err,
                life: 3000
            });
        }
    };

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };

    const saveApplicant = async () => {
        try {
            let _applicants = [...applicants];
            if (selectedApplicant._id) {
                const updated = await ApplicantService.updateApplicant(selectedApplicant);
                const index = _applicants.findIndex((c) => c._id === selectedApplicant._id);
                _applicants[index] = updated;
            } else {
                const created = await ApplicantService.createApplicant(selectedApplicant);
                _applicants.push(created);
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

    const getHeading = () => {
        switch (category) {
            case Category.academic:
                return 'Academic Applicants';
            case Category.supportive:
                return 'Supportive Applicants';
            case Category.external:
                return 'External Applicants'
            default:
                return 'Applicants';
        }
    };

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Manage {getHeading()}</h5>
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
                        emptyMessage={`No ${getHeading()} data found.`}
                        header={header}
                        scrollable
                        filters={filters}
                    >
                        <Column selectionMode="single" headerStyle={{ width: '3em' }}></Column>
                        <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                        <Column field="first_name" header="First Name" sortable />
                        <Column field="birth_date" header="Birth Date" body={(rowData) => new Date(rowData.birth_date!).toLocaleDateString()} />
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
                    </DataTable>

                    {selectedApplicant && (
                        <SaveDialog
                            visible={showSaveDialog}
                            applicant={selectedApplicant}
                            onChange={setSelectedApplicant}
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

export default ApplicantPage;
