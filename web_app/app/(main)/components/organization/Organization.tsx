'use client';
import DeleteDialog from '@/components/DeleteDialog';
import { AcademicLevel, Classification, getChildType, Organization, OrganizationType } from '@/models/organization';
import { OrganizationService } from '@/services/OrganizationService';
import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableExpandedRows, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import SaveDialog from './dialogs/SaveDialog';

interface OrganizationCompProps {
    type: OrganizationType;
    parent?: Organization;
}

const OrganizationComp = (props: OrganizationCompProps) => {

    const type = props.type;
    const childType = getChildType(type);

    let emptyOrganization: Organization = {
        name: '',
        type: type,
        parent: props.parent
    };
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [selectedOrganization, setSelectedOrganization] = useState<Organization>(emptyOrganization);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const toast = useRef<Toast>(null);
    const [expandedRows, setExpandedRows] = useState<any[] | DataTableExpandedRows>([]);

    const isProgram = props.type === OrganizationType.Program;
    const isSpecialization = props.type === OrganizationType.Specialization;
    const isPosition = props.type === OrganizationType.Position;
    const isExternal = props.type === OrganizationType.External;

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };

    const loadOrganizations = useCallback(async () => {
        try {
            if (props.parent?._id) {
                const data = await OrganizationService.getOrganizationsByParent(props.parent._id);
                setOrganizations(data);
            } else {
                const data = await OrganizationService.getOrganizationsByType(type);
                setOrganizations(data);
            }
        } catch (err) {
            console.error('Failed to load organizations:', err);
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to load organizations data',
                detail: '' + err,
                life: 3000
            });
        }
    }, [props.parent?._id, type, toast]);

    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
        loadOrganizations();
    }, [type, loadOrganizations]);

    const saveOrganization = async () => {
        try {
            let _organizations = [...(organizations as any)];
            if (selectedOrganization._id) {
                const updatedOrganization = await OrganizationService.updateOrganization(selectedOrganization);
                const index = organizations.findIndex((organization) => organization._id === selectedOrganization._id);
                _organizations[index] = updatedOrganization;
            } else {
                const newOrganization = await OrganizationService.createOrganization(selectedOrganization);
                _organizations.push({ ...selectedOrganization, _id: newOrganization._id });
            }
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: `${type} ${selectedOrganization._id ? "updated" : 'created'}`,
                life: 3000
            });
            setOrganizations(_organizations);
        } catch (error) {
            console.error(error);
            toast.current?.show({
                severity: 'error',
                summary: `Failed to ${selectedOrganization._id ? "update" : 'create'} organization`,
                detail: '' + error,
                life: 3000
            });
        } finally {
            setShowSaveDialog(false);
            setSelectedOrganization(emptyOrganization);
        }
    };

    const deleteOrganization = async () => {
        try {
            const deleted = await OrganizationService.deleteOrganization(selectedOrganization);
            if (deleted) {
                let _organizations = (organizations as any)?.filter((val: any) => val._id !== selectedOrganization._id);
                setOrganizations(_organizations);
                toast.current?.show({
                    severity: 'success',
                    summary: 'Successful',
                    detail: `${type} Deleted`,
                    life: 3000
                });
            }
        } catch (error) {
            console.error(error);
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to delete organizations',
                detail: '' + error,
                life: 3000
            });
        } finally {
            setShowDeleteDialog(false);
            setSelectedOrganization(emptyOrganization);
        }
    };

    const openSaveDialog = (organization: Organization) => {
        setSelectedOrganization({ ...organization });
        setShowSaveDialog(true);
    };

    const hideSaveDialog = () => {
        setShowSaveDialog(false);
        setSelectedOrganization(emptyOrganization);
    };

    const confirmDeleteItem = (organization: Organization) => {
        setSelectedOrganization(organization);
        setShowDeleteDialog(true);
    };

    const startToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label={`New ${type}`} icon="pi pi-plus" severity="success" className="mr-2" onClick={() => openSaveDialog(emptyOrganization)} />
                </div>
            </React.Fragment>
        );
    };

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Manage {type}s</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" value={globalFilter} onChange={onGlobalFilterChange} placeholder="Search..." className="w-full md:w-1/3" />
            </span>
        </div>
    );

    const actionBodyTemplate = (rowData: Organization) => {
        return (
            <>
                <Button icon="pi pi-pencil" rounded severity="success" className="p-button-rounded p-button-text"
                    style={{ fontSize: '2rem' }} onClick={() => openSaveDialog(rowData)} />
                <Button icon="pi pi-trash" rounded severity="warning" className="p-button-rounded p-button-text"
                    style={{ fontSize: '2rem' }} onClick={() => confirmDeleteItem(rowData)} />
            </>
        );
    };

    const academicLevelBodyTemplate = (rowData: Organization) => {
        return (
            <span className={`academic-badge level-${rowData.academic_level?.toLowerCase()}`}>
                {rowData.academic_level}
            </span>
        );
    };

    const classificationBodyTemplate = (rowData: Organization) => {
        return (
            <span className={`classification-badge classification-${rowData.classification?.toLowerCase()}`}>
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
                        value={organizations}
                        selection={selectedOrganization}
                        onSelectionChange={(e) => setSelectedOrganization(e.value as Organization)}
                        dataKey="_id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate={`Showing {first} to {last} of {totalRecords} ${type}s`}
                        globalFilter={globalFilter}
                        emptyMessage={`No ${type} organization data found.`}
                        header={header}
                        scrollable
                        filters={filters}
                        onRowDoubleClick={(e) => {
                            const selected = e.data;
                            if (selected) {
                                setSelectedOrganization(selected as Organization);
                            }
                        }}
                        {...(childType && {
                            expandedRows: expandedRows,
                            onRowToggle: (e) => setExpandedRows(e.data),
                            rowExpansionTemplate: (data) => (
                                <OrganizationComp
                                    type={childType}
                                    parent={data as Organization}
                                />
                            )
                        })}
                    >
                        {
                            childType
                                ? <Column expander style={{ width: '3em' }} />
                                : <Column selectionMode="single" headerStyle={{ width: '3em' }} />
                        }
                        <Column
                            header="#"
                            body={(rowData, options) => options.rowIndex + 1}
                            style={{ width: '50px' }}
                        />
                        <Column field="name" header="Name" sortable headerStyle={{ minWidth: '15rem' }} />
                        {(isSpecialization || isProgram) && (
                            <Column field="academic_level" header="Ac. Level" body={academicLevelBodyTemplate} sortable />
                        )}
                        {isProgram && (
                            <Column field="classification" header="Classification" body={classificationBodyTemplate} sortable />
                        )}
                        {isPosition && (
                            <Column field="category" header="Category" sortable />
                        )}
                        {isExternal && (
                            <Column field="ownership" header="Ownership" sortable />
                        )}
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
                    </DataTable>

                    {selectedOrganization &&
                        <SaveDialog
                            visible={showSaveDialog}
                            organization={selectedOrganization}
                            onChange={setSelectedOrganization}
                            onSave={saveOrganization}
                            onHide={hideSaveDialog}
                        />}

                    {selectedOrganization &&
                        <DeleteDialog
                            showDeleteDialog={showDeleteDialog}
                            selectedDataInfo={selectedOrganization.name}
                            onDelete={deleteOrganization}
                            onHide={() => setShowDeleteDialog(false)}
                        />}

                </div>
            </div>
        </div>
    );
};

export default OrganizationComp;
