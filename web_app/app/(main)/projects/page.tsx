'use client';

import DeleteDialog from '@/components/DeleteDialog';

import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableExpandedRows, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import { Project } from './models/project.model';
import { ProjectApi } from './api/project.api';
import SaveDialog from './components/dialogs/SaveDialog';
import { CallApi } from '../calls/api/call.api';
import { Call, CallStatus } from '../calls/models/call.model';
import ProjectDetail from './components/ProjectDetail';

const ProjectPage = () => {
    const emptyProject: Project = {
        call: '',
        title: ''
    };

    const [calls, setCalls] = useState<Call[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [selectedProject, setSelectedProject] = useState<Project>(emptyProject);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const toast = useRef<Toast>(null);
    const [expandedRows, setExpandedRows] = useState<any[] | DataTableExpandedRows>([]);

    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
        loadCalls();
        loadProjects();
    }, []);


    const loadCalls = async () => {
        try {
            const data = await CallApi.getCalls({ status: CallStatus.active });
            setCalls(data);
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to load call data',
                detail: '' + err,
                life: 3000
            });
        }
    };

    const loadProjects = async () => {
        try {
            const data = await ProjectApi.getProjects();
            setProjects(data);
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to load project data',
                detail: '' + err,
                life: 3000
            });
        }
    };

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };

    const saveProject = async () => {
        try {
            let _projects = [...projects];
            if (selectedProject._id) {
                const updated = await ProjectApi.updateProject(selectedProject);
                const index = _projects.findIndex((c) => c._id === updated._id);
                _projects[index] = selectedProject;
            } else {
                const created = await ProjectApi.createProject(selectedProject);
                _projects.push({ ...created, call:selectedProject.call });
            }
            setProjects(_projects);
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: `Project ${selectedProject._id ? 'updated' : 'created'}`,
                life: 3000
            });
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to save project',
                detail: '' + err,
                life: 3000
            });
        } finally {
            setShowSaveDialog(false);
            setSelectedProject(emptyProject);
        }
    };

    const deleteProject = async () => {
        const deleted = await ProjectApi.deleteProject(selectedProject);
        if (deleted) {
            setProjects(projects.filter((c) => c._id !== selectedProject._id));
            setShowDeleteDialog(false);
            setSelectedProject(emptyProject);
        }
    };

    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button label="New Project" icon="pi pi-plus" severity="success" className="mr-2"
                onClick={() => {
                    setSelectedProject(emptyProject);
                    setShowSaveDialog(true);
                }}
            />
        </div>
    );

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Manage Projects</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" value={globalFilter} onChange={onGlobalFilterChange} placeholder="Search..." className="w-full md:w-1/3" />
            </span>
        </div>
    );

    const actionBodyTemplate = (rowData: Project) => (
        <>
            <Button icon="pi pi-pencil" rounded severity="success" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setSelectedProject(rowData);
                    setShowSaveDialog(true);
                }} />
            <Button icon="pi pi-trash" rounded severity="warning" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setSelectedProject(rowData);
                    setShowDeleteDialog(true);
                }} />
        </>
    );


    const statusBodyTemplate = (rowData: Project) => {
        return (
            <span className={`project-badge status-${rowData.status}`}>{rowData.status}</span>
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
                        value={projects}
                        selection={selectedProject}
                        onSelectionChange={(e) => setSelectedProject(e.value as Project)}
                        dataKey="_id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} projects"
                        globalFilter={globalFilter}
                        emptyMessage="No project data found."
                        header={header}
                        scrollable
                        filters={filters}
                        expandedRows={expandedRows}
                        onRowToggle={(e) => setExpandedRows(e.data)}
                        rowExpansionTemplate={(rowData) => {
                            return <ProjectDetail project={rowData as Project} />;
                        }}
                    >
                        <Column expander headerStyle={{ width: '3em' }}></Column>
                        <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                        <Column field="call.title" header="Call" />
                        <Column field="title" header="Title" sortable />
                        <Column header="Status" body={statusBodyTemplate} sortable />
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
                    </DataTable>

                    {selectedProject && (
                        <SaveDialog
                            visible={showSaveDialog}
                            project={selectedProject}
                            onChange={setSelectedProject}
                            onSave={saveProject}
                            onHide={() => setShowSaveDialog(false)}
                            calls={calls}
                        />
                    )}

                    {selectedProject && (
                        <DeleteDialog
                            showDeleteDialog={showDeleteDialog}
                            selectedDataInfo={String(selectedProject.title)}
                            onDelete={deleteProject}
                            onHide={() => setShowDeleteDialog(false)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectPage;
