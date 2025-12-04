'use client';
import ConfirmDialog from '@/components/ConfirmationDialog';
import ErrorCard from '@/components/ErrorCard';
import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableExpandedRows, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toolbar } from 'primereact/toolbar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { OrganizationApi } from '../api/organization.api';
import { getChildType, Organization, OrganizationalUnit } from '../models/organization.model';
import SaveDialog from './SaveDialog';


interface OrganizationMangerProps {
    type: OrganizationalUnit;
    parent?: Organization;
}

const OrganizationManager = (props: OrganizationMangerProps) => {

    const type = props.type;
    const childType = getChildType(type);

    let emptyOrganization: Organization = {
        name: '',
        type: type,
        parent: props.parent
    };
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [error, setError] = useState<string | null>(null);
    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [selectedOrganization, setSelectedOrganization] = useState<Organization>(emptyOrganization);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    //const toast = useRef<Toast>(null);
    const [expandedRows, setExpandedRows] = useState<any[] | DataTableExpandedRows>([]);

    const isProgram = props.type === OrganizationalUnit.Program;
    const isSpecialization = props.type === OrganizationalUnit.Specialization;
    const isExternal = props.type === OrganizationalUnit.External;

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };

    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
    }, []);

    const fetchOrganizations = useCallback(async () => {
        try {
            if (props.parent) {
                const data = await OrganizationApi.getOrganizations({ parent: props.parent._id });
                setOrganizations(data);
            } else {
                const data = await OrganizationApi.getOrganizations({ type: props.type });
                setOrganizations(data);
            }
        } catch (err) {
            //console.error('Failed to load organizations:', err);
            setError(`Failed to load organizations. ${err}`);
        }
    }, [props.parent?._id, type, error]);

    useEffect(() => {
        fetchOrganizations();
    }, [type, fetchOrganizations]);

    if (error) {
        return (
            <ErrorCard errorMessage={error} />
        );
    }

    const onSaveComplete = (savedOrganization: Organization) => {
        let _organizations = [...organizations];
        const index = _organizations.findIndex((o) => o._id === savedOrganization._id);

        if (index !== -1) {
            _organizations[index] = { ...savedOrganization };
        } else {
            _organizations.push({ ...savedOrganization });
        }
        setOrganizations(_organizations);
        hideDialogs();
    };


    const deleteOrganization = async () => {
        const deleted = await OrganizationApi.deleteOrganization(selectedOrganization);
        if (deleted) {
            let _organizations = (organizations as any)?.filter((val: any) => val._id !== selectedOrganization._id);
            setOrganizations(_organizations);
        }
    };

    const openSaveDialog = (organization: Organization) => {
        setSelectedOrganization({ ...organization });
        setShowSaveDialog(true);
    };


    const confirmDeleteItem = (organization: Organization) => {
        setSelectedOrganization(organization);
        setShowDeleteDialog(true);
    };

    const hideDialogs = () => {
        setShowSaveDialog(false);
        setShowDeleteDialog(false);
        setSelectedOrganization(emptyOrganization);
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
            <h5 className="m-0">Manage {props.parent?.name} {type}s</h5>
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

    const ownershipBodyTemplate = (rowData: Organization) => {
        return (
            <span className={`ownership-badge ownership-${rowData.ownership?.toLowerCase()}`}>
                {rowData.ownership}
            </span>
        );
    };

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
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
                                <OrganizationManager
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
                        {isExternal && (
                            <Column field="ownership" header="Ownership" body={ownershipBodyTemplate} sortable />
                        )}
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
                    </DataTable>

                    {selectedOrganization &&
                        <SaveDialog
                            visible={showSaveDialog}
                            organization={selectedOrganization}
                            onComplete={onSaveComplete}
                            onHide={hideDialogs}
                        />}

                    {selectedOrganization &&
                        <ConfirmDialog
                            showDialog={showDeleteDialog}
                            item={selectedOrganization.name}
                            onConfirmAsync={deleteOrganization}
                            onHide={hideDialogs}
                        />}
                </div>
            </div>
        </div>
    );
};

export default OrganizationManager;
